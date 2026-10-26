// Unit tests: order payment buckets (/admin/orders), quote paid-state from Stripe events
// (ACH), Net-terms credit limit, Stripe automatic-tax mode.
// Run: node --experimental-strip-types --no-warnings --test scripts/test-orders-payments.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { paymentBucket, paymentLabel } from '../src/lib/orders/payment-view.ts'
import { quotePaidByEvent } from '../src/lib/quotes/payment-state.ts'
import { checkCreditLimit } from '../src/lib/quotes/credit.ts'
import { taxMode, automaticTaxEnabled } from '../src/lib/stripe-tax.ts'

const NOW = Date.parse('2026-10-26T12:00:00Z')
const ago = (h) => new Date(NOW - h * 3600_000).toISOString()

test('order payment buckets: paid / awaiting / abandoned > 24h', () => {
  assert.equal(paymentBucket({ payment_status: 'paid', created_at: ago(100) }, NOW), 'paid')
  assert.equal(paymentBucket({ payment_status: 'pending', created_at: ago(2) }, NOW), 'awaiting')
  assert.equal(paymentBucket({ payment_status: 'pending', created_at: ago(25) }, NOW), 'abandoned')
  assert.equal(paymentBucket({ payment_status: 'processing', created_at: ago(72) }, NOW), 'awaiting') // ACH clearing
  assert.equal(paymentBucket({ payment_status: 'invoiced', created_at: ago(500) }, NOW), 'awaiting') // net terms
  assert.equal(paymentBucket({ payment_status: 'expired', created_at: ago(1) }, NOW), 'abandoned')
  assert.equal(paymentBucket({ payment_status: 'failed', created_at: ago(1) }, NOW), 'abandoned')
  assert.equal(paymentLabel({ payment_status: 'pending', created_at: ago(30) }, NOW), 'Abandoned checkout')
  assert.equal(paymentLabel({ payment_status: 'processing', created_at: ago(1) }, NOW), 'ACH processing')
})

test('a quote is ordered only when the money is in (ACH waits for async_payment_succeeded)', () => {
  assert.equal(quotePaidByEvent('checkout.session.completed', 'paid'), true)
  assert.equal(quotePaidByEvent('checkout.session.completed', 'unpaid'), false) // ACH submitted, not cleared
  assert.equal(quotePaidByEvent('checkout.session.async_payment_succeeded', 'paid'), true)
  assert.equal(quotePaidByEvent('checkout.session.async_payment_failed', 'unpaid'), false)
  assert.equal(quotePaidByEvent('checkout.session.expired', 'unpaid'), false)
})

test('Net terms credit: quote + open invoices must fit under the limit', () => {
  assert.equal(checkCreditLimit(2_500_000, 0, 1_000_000).ok, true)
  assert.equal(checkCreditLimit(2_500_000, 1_600_000, 900_000).ok, true) // exactly at the limit
  const over = checkCreditLimit(2_500_000, 1_600_000, 900_001)
  assert.equal(over.ok, false)
  assert.equal(over.availableCents, 900_000)
  assert.match(over.message, /more than your available Net terms credit/)
  assert.equal(checkCreditLimit(null, 0, 100).ok, false) // no limit on file → refused (fail closed)
  assert.equal(checkCreditLimit(0, 0, 100).ok, false)
})

test('Stripe automatic tax: off by default; exempt approved accounts get an exempt customer', () => {
  assert.equal(automaticTaxEnabled({}), false)
  assert.equal(automaticTaxEnabled({ STRIPE_AUTOMATIC_TAX: '1' }), true)
  const guest = { status: 'guest', taxExempt: false, email: null }
  const exempt = { status: 'approved', taxExempt: true, email: 'a@b.co' }
  assert.equal(taxMode(false, exempt), 'off')
  assert.equal(taxMode(true, guest), 'auto')
  assert.equal(taxMode(true, exempt), 'exempt')
  assert.equal(taxMode(true, { ...exempt, status: 'pending' }), 'auto') // exemption only once approved
})
