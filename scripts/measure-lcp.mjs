// Measures Largest Contentful Paint for a URL with Playwright + PerformanceObserver.
// Usage: node scripts/measure-lcp.mjs [url] [runs]
// Default: http://localhost:3105/ , 5 runs per profile (after one warm-up load so the
// next/image optimizer cache is primed, which is how production behaves).
// Profiles: desktop (1440x900, no throttling) and mobile (390x844, "Fast 4G"-style
// throttling: 9 Mbps down / 1.5 Mbps up / 150 ms RTT, 4x CPU slowdown).
// Playwright is installed globally in the dev/CI image (not a project dependency),
// so resolve it through CommonJS require, which honours NODE_PATH.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

const url = process.argv[2] ?? 'http://localhost:3105/'
const runs = Number(process.argv[3] ?? 5)

const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, throttle: null },
  {
    name: 'mobile-4g',
    viewport: { width: 390, height: 844 },
    throttle: { latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8, cpu: 4 },
  },
]

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }

const browser = await chromium.launch()
const results = {}
for (const prof of profiles) {
  const lcps = []
  const loads = []
  let lastEl = ''
  let bytes = 0
  for (let i = 0; i <= runs; i++) {
    const ctx = await browser.newContext({ viewport: prof.viewport })
    const page = await ctx.newPage()
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    if (prof.throttle) {
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...prof.throttle })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.throttle.cpu })
    }
    let pageBytes = 0
    cdp.on('Network.loadingFinished', (e) => { pageBytes += e.encodedDataLength })
    await page.addInitScript(() => {
      window.__lcp = { t: 0, el: '' }
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__lcp.t = e.startTime
          const el = e.element
          window.__lcp.el = el ? `${el.tagName.toLowerCase()}${el.currentSrc ? ' ' + el.currentSrc.split('/').pop().slice(0, 80) : ' "' + (el.textContent || '').trim().slice(0, 40) + '"'}` : e.url
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    await page.goto(url, { waitUntil: 'load', timeout: 120000 })
    await page.waitForTimeout(1500)
    const lcp = await page.evaluate(() => ({ ...window.__lcp, load: performance.getEntriesByType('navigation')[0].loadEventEnd }))
    if (i > 0) { lcps.push(lcp.t); loads.push(lcp.load); lastEl = lcp.el; bytes = pageBytes } // run 0 = warm-up
    await ctx.close()
  }
  results[prof.name] = { medianLcpMs: Math.round(median(lcps)), medianLoadMs: Math.round(median(loads)), runsMs: lcps.map(Math.round), lcpElement: lastEl, transferKB: Math.round(bytes / 1024) }
}
await browser.close()
console.log(JSON.stringify({ url, results }, null, 2))
