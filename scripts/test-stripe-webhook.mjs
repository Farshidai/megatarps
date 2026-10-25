#!/usr/bin/env node
// Webhook signature test for POST /api/webhooks/stripe.
// Usage: start the server with a known secret, then run with the same secret:
//   STRIPE_WEBHOOK_SECRET=whsec_local_test PORT=3112 npm start
//   STRIPE_WEBHOOK_SECRET=whsec_local_test BASE_URL=http://localhost:3112 node scripts/test-stripe-webhook.mjs
import Stripe from 'stripe'

const BASE = process.env.BASE_URL ?? 'http://localhost:3102'
const secret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = new Stripe('sk_test_unused')
let failures = 0
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++ }

const event = {
  id: 'evt_test_1', object: 'event', type: 'checkout.session.completed', api_version: '2026-03-25.dahlia',
  data: { object: { id: 'cs_test_1', object: 'checkout.session', payment_status: 'paid', amount_total: 1000, amount_subtotal: 1000,
    metadata: { order_id: '00000000-0000-0000-0000-000000000000', order_number: 'MO-TEST-1', quote_id: '11111111-1111-1111-1111-111111111111' } } },
}
const payload = JSON.stringify(event)
const post = (headers, body = payload) => fetch(`${BASE}/api/webhooks/stripe`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body })

let r = await post({})
ok(r.status === 400, `missing signature → 400 (${r.status})`)
r = await post({ 'stripe-signature': 't=1,v1=deadbeef' })
ok(r.status === 400, `forged signature → 400 (${r.status})`)
if (secret) {
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret })
  r = await post({ 'stripe-signature': header }, payload.replace('"amount_total":1000', '"amount_total":1'))
  ok(r.status === 400, `valid signature but tampered body → 400 (${r.status})`)
  r = await post({ 'stripe-signature': header })
  const j = await r.json()
  ok(r.status === 200 && j.received, `valid signature → 200 ${JSON.stringify(j)}`)
} else {
  console.log('SKIP  valid-signature checks (set STRIPE_WEBHOOK_SECRET to match the server)')
}
console.log(failures ? `\n${failures} FAILED` : '\nWebhook signature checks passed.')
process.exit(failures ? 1 : 0)
