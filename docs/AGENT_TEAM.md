# MegaTarps.com — Wholesale v2 Agent Team Brief

**Goal:** turn megatarps.com into a real B2B wholesale site for heavy-duty tarps and
construction supplies. The buyers are contractors, roofers, farms and warehouses who
order by the case or the pallet. MegaTarps (Mega Innovation Group LLC, Kansas City
metro) imports from China and supplies the Midwest.

## Stack (do not change)
- Next.js **16** App Router, React 19, TypeScript, Tailwind **v4**, lucide-react icons
  - ⚠️ Next 16 has breaking changes. Read `node_modules/next/dist/docs/` for any API
    you are unsure of. Middleware is `src/proxy.ts` (exports `proxy`), not `middleware.ts`.
  - Server components by default; `'use client'` only when you need interactivity.
- Supabase (Postgres + Auth + Storage) via `@supabase/ssr`: `src/lib/supabase/{server,client}.ts`
- Stripe (Checkout Sessions + webhook), Resend (email), Anthropic API (chat widget)
- Brand: navy `#0f172a`, orange `#f97316`. Match the existing look in `src/app/page.tsx`,
  `Navbar.tsx` and `ProductCard.tsx`. Clean, industrial, trustworthy. No new UI libraries.

## Shared foundation (already built, use it, don't fork it)
| File | What it is |
|---|---|
| `src/lib/pricing.ts` | **The only pricing engine.** `unitPriceCents`, `lineTotalCents`, `priceTiers`, `lowestUnitPriceCents`, `isQuoteOnly`. A product with `retail_price_cents = 0` is **quote-only** (it can't be bought online, only quoted). |
| `src/lib/products.ts` | Data access, plus `getPricingRules()`. Falls back to demo data automatically. |
| `src/lib/demo.ts` + `src/data/demo-catalog.json` | DEMO MODE. When Supabase isn't configured, catalog data comes from JSON built from the real seed SQL. Rebuild with `node scripts/build-demo-data.mjs [seed files...]`. |
| `src/lib/cart/types.ts` | **Cart contract**: `CART_STORAGE_KEY`, `CartItem`. No prices stored in the cart. |
| `src/lib/accounts.ts` | **Account contract**: `getAccountPricing()`. Stub now; the Accounts team implements it. |

DEMO MODE rule: any page or route **you** touch that queries Supabase directly must not
crash in demo mode. Check `isDemoMode()` from `@/lib/demo` and return sensible demo data,
or an empty state with a clear message. That's how QA can click through everything.

## Running locally
```bash
npm ci                          # in your worktree (node_modules is not shared)
cp /home/claude/megatarps/.env.local .env.local   # placeholder keys → demo mode
npm run build                   # must pass before you finish
PORT=<your port> npm start      # then check pages with curl or Playwright
```
Playwright and Chromium are preinstalled: `require('playwright')`, and `chromium.launch()`
needs no options. Take screenshots of your key screens (desktop 1440 wide, mobile 390
wide) and save them to `docs/screens/<team>-*.png` so the lead can review them visually.

## Database changes
- **Never edit `supabase/schema.sql`.** Add a numbered migration in `supabase/migrations/`:
  - Catalog team `0002_*.sql`, Accounts team `0003_*.sql`, Quotes team `0004_*.sql`
- Migrations must be idempotent (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`).
- Include RLS policies for any new table or column that holds private data.
- After adding a migration, run `node scripts/build-demo-data.mjs` (catalog team: pass your seed files) to prove it applies cleanly.

## File ownership (stay in your lane; this avoids merge conflicts)
| Team | Owns |
|---|---|
| **A: Catalog & Pricing UI** | `src/app/products/**`, `src/app/product/**`, `src/components/products/ProductCard.tsx`, `ProductFilters.tsx`, new `src/components/products/TierPriceTable.tsx`, `src/app/admin/products/**`, `src/app/admin/pricing-rules/**`, `supabase/migrations/0002_*`, `supabase/seed*.sql`, `src/data/demo-catalog.json` |
| **B: Cart, Checkout & Quick Order** | `src/lib/cart/**` (keep types.ts contract), `src/components/cart/**`, `src/components/products/AddToCartOrRFQ.tsx`, `src/components/layout/Navbar.tsx`, `src/app/cart/**`, `src/app/quick-order/**`, `src/app/checkout/**`, `src/app/api/checkout/**`, `src/app/api/webhooks/stripe/**`, `src/app/account/orders/**` |
| **C: Wholesale Accounts** | `src/lib/accounts.ts` (keep the signature), `src/app/account/register/**`, `src/app/account/page.tsx`, `src/app/account/settings/**`, `src/app/account/layout.tsx`, `src/app/admin/accounts/**`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/proxy.ts`, `src/app/apply/**`, `supabase/migrations/0003_*`, `src/lib/email/**` |
| **D: Quotes / RFQ lifecycle** | `src/components/forms/BulkQuoteForm.tsx`, `src/app/bulk-quote/**`, `src/app/api/rfq/**`, `src/app/api/quotes/**`, `src/app/admin/rfqs/**`, `src/app/account/quotes/**`, `src/app/quote/**`, `src/app/api/chat/**`, `src/components/chat/**`, `supabase/migrations/0004_*` |
| **E: SEO, Content & Performance** | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/resources/**`, `src/app/about/**`, `src/app/contact/**`, `src/app/terms/**`, `src/app/privacy/**`, `src/components/layout/Footer.tsx`, `src/components/seo/**`, `public/**`, `next.config.ts` |

If you truly need a change in another team's file, keep it minimal and additive,
and list it under "cross-team edits" in your final report.

## Cross-team agreements
1. **Product page → AddToCartOrRFQ:** Team A renders `<AddToCartOrRFQ product={product} rules={rules} />`.
   Team B adds the optional `rules?: PricingRule[]` prop.
2. **Cart → Quote:** the cart page (B) has a "Request a quote for this cart" button that links to
   `/bulk-quote?from=cart`. `BulkQuoteForm` (D) then pre-fills its line items from
   localStorage `CART_STORAGE_KEY`. Quote-only cart lines can never go to Stripe; B
   routes them through that button.
3. **Paid quotes:** D creates Stripe Checkout Sessions for accepted quotes with
   `metadata.quote_id` and `metadata.order_number`. B's webhook, when `metadata.quote_id`
   is present, also sets that quote's `status = 'ordered'`.
4. **Wholesale pricing:** checkout (B) and quote acceptance (D) price server-side with
   `unitPriceCents(product, qty, rules, { wholesaleDiscountPercent })` from `getAccountPricing()`.
   **Never trust a price sent by the browser.**
5. **Admin nav:** C owns `admin/layout.tsx`. It must contain links to Dashboard, Orders,
   RFQs/Quotes, Products, Pricing Rules and Accounts.
6. Email helpers live in `src/lib/email/` (C creates `send.ts` with
   `sendEmail({to, subject, html})`, a no-op that logs in demo mode or when `RESEND_API_KEY`
   is missing). D can use it; if it doesn't exist yet in your worktree, create the same
   file with exactly that signature.

## Definition of done (every team)
- `npx tsc --noEmit` and `npm run build` pass. `npm run lint` adds no new errors in your files.
- Your screens work in demo mode, with screenshots saved to `docs/screens/`.
- Mobile responsive. Accessible: labels, alt text, focus states.
- Commit your work on your worktree branch with clear messages. **Do not push.**
- Final report: what you built, files changed, migrations added, cross-team edits,
  anything Farshid must do by hand (env vars, Supabase SQL, Stripe settings), and known gaps.
