#!/usr/bin/env node
// End-to-end smoke test + screenshots for the cart / checkout / quick order flow (demo mode).
// Usage: BASE_URL=http://localhost:3102 node scripts/e2e-cart.mjs
// Screenshots land in docs/screens/b-*.png
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

// playwright is preinstalled globally in the agent image (not a project dependency)
function loadPlaywright() {
  const req = createRequire(import.meta.url)
  try { return req('playwright') } catch {}
  const globalRoot = execSync('npm root -g').toString().trim()
  return createRequire(globalRoot + '/').call(null, 'playwright')
}
const { chromium } = loadPlaywright()

const BASE = process.env.BASE_URL ?? 'http://localhost:3102'
const OUT = new URL('../docs/screens/', import.meta.url).pathname
const PRICED = '/product/20-x-30-extreme-duty-poly-tarp-12-mil'
const QUOTE_ONLY = '/product/16mil-brown-4x20'

let failures = 0
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++ }
const consoleErrors = []

const browser = await chromium.launch()

async function newPage(ctx) {
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(`${page.url()}: ${m.text()}`) })
  page.on('pageerror', (e) => consoleErrors.push(`${page.url()}: ${e.message}`))
  return page
}

async function run(viewport, tag) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: tag === 'mobile' ? 2 : 1 })
  // sandboxed CI has no outbound network: fail external requests (CDN images) fast
  if (process.env.E2E_OFFLINE !== '0') await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort())
  const page = await newPage(ctx)

  // ---- product buy box
  await page.goto(BASE + PRICED, { waitUntil: 'load' })
  const qty = page.locator('#buybox-qty')
  await qty.fill('3')
  await page.waitForTimeout(150)
  const nudge = page.getByText(/Add 2 more to save 8%/)
  ok(await nudge.isVisible(), `[${tag}] buy box shows next-tier nudge at qty 3`)
  const unit3 = await page.getByTestId('unit-price').innerText()
  await nudge.click()
  const unit5 = await page.getByTestId('unit-price').innerText()
  ok(unit3 !== unit5 && (await qty.inputValue()) === '5', `[${tag}] nudge bumps qty to 5 and lowers unit price (${unit3} → ${unit5})`)
  const box = page.getByTestId('buy-box')
  await box.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}b-buybox-${tag}.png`, fullPage: false })
  const sw = await page.getByTestId('ship-weight-info').innerText(); ok(/Ship weight ≈ 25 lb each/.test(sw), `[${tag}] buy box shows ship weight ≈ 25 lb each`)
  ok(!(await page.getByTestId('ltl-notice').isVisible().catch(() => false)), `[${tag}] 5 units (89 lb) ships parcel, no LTL notice`)
  await qty.fill('9')
  await page.waitForTimeout(150)
  ok(await page.getByTestId('ltl-notice').isVisible(), `[${tag}] 9 units (159 lb) shows "Ships by truck freight (LTL)"`)
  await page.getByTestId('ship-weight-info').scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}b-freight-buybox-${tag}.png`, fullPage: false })
  await qty.fill('5')
  await page.waitForTimeout(150)

  // ---- add to cart → drawer
  await page.getByRole('button', { name: /^Add to Cart$/ }).click()
  const drawer = page.getByRole('dialog', { name: /Your Cart/ })
  await drawer.waitFor()
  await page.waitForSelector('[data-testid="drawer-subtotal"]:not(:has-text("…"))')
  ok(await drawer.isVisible(), `[${tag}] drawer opens after Add to Cart`)
  ok((await page.getByTestId('cart-count').innerText()) === '5', `[${tag}] navbar badge shows 5 units`)
  ok((await page.getByTestId('freight-amount').innerText()) === '$87.50', `[${tag}] drawer freight: 125 lb parcel = $25 + 125 × $0.50 = $87.50`)
  await page.screenshot({ path: `${OUT}b-drawer-${tag}.png` })
  await page.keyboard.press('Escape')
  ok(!(await drawer.isVisible().catch(() => false)), `[${tag}] Escape closes drawer`)

  // ---- quote-only product
  await page.goto(BASE + QUOTE_ONLY, { waitUntil: 'load' })
  ok(await page.getByText(/priced by quote|pricing by quote/i).first().isVisible(), `[${tag}] quote-only product shows quote messaging`)
  await page.getByRole('button', { name: /Add to cart for quote/ }).click()
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape')

  // ---- cross-tab sync
  const page2 = await newPage(ctx)
  await page2.goto(BASE + '/cart', { waitUntil: 'load' })
  await page2.getByTestId('cart-subtotal').waitFor()
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('megatarps_cart_v1'))
    s.items[0].quantity = 6
    localStorage.setItem('megatarps_cart_v1', JSON.stringify(s))
  })
  await page2.waitForFunction(() => document.querySelector('[data-testid="cart-count"]')?.textContent === '7', null, { timeout: 5000 }).catch(() => {})
  ok((await page2.getByTestId('cart-count').innerText()) === '7', `[${tag}] other tab updates via storage event (badge 7)`)
  await page2.close()

  // ---- cart page
  await page.goto(BASE + '/cart', { waitUntil: 'load' })
  await page.getByTestId('cart-subtotal').waitFor()
  ok(await page.getByRole('heading', { name: /Priced by quote/ }).isVisible(), `[${tag}] cart shows separate quote-only section`)
  ok((await page.getByTestId('quote-cart').getAttribute('href')) === '/bulk-quote?from=cart', `[${tag}] quote button links to /bulk-quote?from=cart`)
  await page.screenshot({ path: `${OUT}b-cart-${tag}.png`, fullPage: tag === 'desktop' })

  // ---- quick order
  await page.goto(BASE + '/quick-order', { waitUntil: 'load' })
  const first = page.getByRole('combobox', { name: 'Row 1 SKU or size' })
  await first.fill('12x16 10 mil')
  await page.getByRole('option').first().click()
  await page.locator('[data-testid="qo-row"]').first().locator('input[type=number]').fill('25')
  await page.getByRole('button', { name: /Paste a list/ }).click()
  await page.locator('#paste-list').fill('MT-20X30-12MIL, 4\nBB-9B-10\t20\nNOPE-123, 2')
  await page.getByRole('button', { name: /Import lines/ }).click()
  ok(await page.getByText(/Imported 2 of 3 lines/).isVisible(), `[${tag}] paste import resolves 2 of 3 and flags the bad one`)
  await page.screenshot({ path: `${OUT}b-quick-order-${tag}.png`, fullPage: tag === 'desktop' })
  await page.getByTestId('qo-add-all').click()
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape')

  // ---- freight quote: pallet-heavy cart + an accessory with no listed weight
  await page.goto(BASE + '/cart', { waitUntil: 'load' })
  await page.getByTestId('cart-subtotal').waitFor()
  ok(await page.getByTestId('freight-quote-required').isVisible(), `[${tag}] heavy / unknown-weight cart → "Freight quote required" replaces Checkout`)
  ok((await page.getByTestId('checkout-button').count()) === 0, `[${tag}] no Checkout button while freight needs a quote`)
  ok((await page.getByTestId('freight-amount').innerText()) === 'Quoted separately', `[${tag}] freight shows "Quoted separately"`)
  await page.screenshot({ path: `${OUT}b-freight-quote-${tag}.png`, fullPage: tag === 'desktop' })

  // ---- parcel-weight cart → checkout (demo) → success clears priced lines, keeps quote lines
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('megatarps_cart_v1'))
    s.items = s.items.filter((i) => i.quote_only || i.sku === 'MT-20X30-12MIL').map((i) => (i.quote_only ? i : { ...i, quantity: 5 }))
    localStorage.setItem('megatarps_cart_v1', JSON.stringify(s))
  })
  await page.reload({ waitUntil: 'load' })
  await page.getByTestId('cart-subtotal').waitFor()
  ok((await page.getByTestId('freight-amount').innerText()) === '$87.50', `[${tag}] cart freight line $87.50 (parcel)`)
  ok(/125 lb/.test(await page.getByTestId('ship-weight').innerText()), `[${tag}] cart shows total ship weight 125 lb`)
  await page.screenshot({ path: `${OUT}b-freight-cart-${tag}.png`, fullPage: tag === 'desktop' })
  await page.getByTestId('checkout-button').click()
  await page.waitForURL(/\/checkout\/success\?demo=1/)
  await page.getByTestId('order-number').waitFor()
  await page.waitForTimeout(300)
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem('megatarps_cart_v1')).items)
  ok(left.length === 1 && left[0].quote_only, `[${tag}] success page clears paid lines, keeps the quote-only line`)
  if (tag === 'desktop') await page.screenshot({ path: `${OUT}b-checkout-success-${tag}.png` })

  // ---- orders → reorder
  await page.goto(BASE + '/account/orders', { waitUntil: 'load' })
  ok((await page.getByTestId('order-card').count()) === 2, `[${tag}] demo orders page shows 2 sample orders`)
  await page.getByTestId('reorder-button').first().click()
  await page.getByRole('dialog').waitFor()
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('megatarps_cart_v1')).items.length)
  ok(after >= 3, `[${tag}] reorder puts the order's lines back in the cart (${after} lines)`)
  await page.keyboard.press('Escape')
  if (tag === 'desktop') await page.screenshot({ path: `${OUT}b-orders-${tag}.png`, fullPage: tag === 'desktop' })

  // ---- admin freight (demo: read-only + calculator)
  if (tag === 'desktop') {
    await page.goto(BASE + '/admin/freight', { waitUntil: 'load' })
    ok(await page.getByText(/Demo mode: read-only/).isVisible(), `[${tag}] admin freight shows demo read-only notice`)
    const c = page.getByRole('combobox', { name: 'Calculator row 1 SKU' })
    await c.fill('MT-40X60-10MIL')
    await page.locator('[role=listbox] [role=option]').first().click()
    await page.getByRole('spinbutton', { name: 'Calculator row 1 quantity' }).fill('2')
    const res = await page.getByTestId('calc-result').innerText()
    ok(/146 lb/.test(res) && /\$98\.00/.test(res), `[${tag}] calculator: 2 × 40x60 10-mil = 146 lb (real packed weight 73 lb each) → $25 + 146 × $0.50 = $98.00`)
    await page.setViewportSize({ width: 1440, height: 1300 })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `${OUT}b-freight-admin-${tag}.png` })
    await page.setViewportSize(viewport)
  }

  // ---- cancel page
  await page.goto(BASE + '/checkout/cancel', { waitUntil: 'load' })
  ok(await page.getByRole('heading', { name: /Checkout cancelled/ }).isVisible(), `[${tag}] cancel page renders`)

  await ctx.close()
}

await run({ width: 1440, height: 900 }, 'desktop')
await run({ width: 390, height: 844 }, 'mobile')
await browser.close()

const hydration = consoleErrors.filter((e) => /hydrat|did not match/i.test(e))
ok(hydration.length === 0, `no hydration errors${hydration.length ? ':\n  ' + hydration.join('\n  ') : ''}`)
if (consoleErrors.length) console.log('Console errors seen:\n  ' + consoleErrors.join('\n  '))
console.log(failures ? `\n${failures} FAILED` : '\nAll e2e checks passed.')
process.exit(failures ? 1 : 0)
