// Unit tests: CSV import rejects whole rows, chat markdown link safety, rate limiter.
// Run: node --experimental-strip-types --no-warnings --test scripts/test-safety.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePriceCsv } from '../src/app/admin/products/_lib/csv.ts'
import { parseChatMarkdown, isSafeChatHref } from '../src/lib/chat-markdown.ts'
import { TokenBucketLimiter, clientIp } from '../src/lib/rate-limit.ts'

test('CSV: a row with any invalid cell is rejected entirely', () => {
  const r = parsePriceCsv('sku,cost,retail,in_stock\nA-1,12.00,19.99,true\nB-2,abc,29.99,true\nC-3,10,20,maybe\nD-4,,15.00,\n')
  assert.deepEqual(r.updates.map((u) => u.sku), ['A-1', 'D-4'])
  assert.equal(r.updates.find((u) => u.sku === 'D-4').retail_cents, 1500)
  assert.equal(r.errors.length, 2)
  assert.match(r.errors[0], /B-2.*whole row skipped/)
  assert.ok(!r.updates.some((u) => u.sku === 'B-2'), 'B-2 retail must not be applied when its cost is invalid')
})

test('chat links: same-site paths and https only; never //host or /\\host', () => {
  assert.equal(isSafeChatHref('/product/x'), true)
  assert.equal(isSafeChatHref('https://megatarps.com/x'), true)
  for (const bad of ['//evil.com', '//evil.com/product', '/\\evil.com', 'javascript:alert(1)', 'http://x.com', 'https:///x', 'data:text/html,x']) {
    assert.equal(isSafeChatHref(bad), false, bad)
  }
  const html = parseChatMarkdown('[ok](/product/a) [bad](//evil.com) [js](javascript:alert(1)) <script>')
  assert.match(html, /<a href="\/product\/a"/)
  assert.ok(!html.includes('evil.com"') && !html.includes('href="//') && !html.includes('href="javascript'))
  assert.ok(html.includes('&lt;script&gt;'))
})

test('rate limiter: token bucket per key, refills over time, LRU-bounded', () => {
  const rl = new TokenBucketLimiter(3)
  const rule = { capacity: 2, refillPerSec: 1 }
  assert.equal(rl.take('a', rule, 0).ok, true)
  assert.equal(rl.take('a', rule, 0).ok, true)
  const third = rl.take('a', rule, 0)
  assert.equal(third.ok, false)
  assert.equal(third.retryAfterSec, 1)
  assert.equal(rl.take('b', rule, 0).ok, true) // other IP unaffected
  assert.equal(rl.take('a', rule, 1000).ok, true) // refilled one token
  rl.take('c', rule, 0); rl.take('d', rule, 0)
  assert.equal(rl.size, 3) // oldest evicted
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' })), '1.2.3.4')
})
