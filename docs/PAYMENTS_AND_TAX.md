# Payments, Net terms and sales tax

## Environment variables
| Variable | Required | What it does |
|---|---|---|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | yes (live) | Card / ACH checkout and the webhook |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (live) | Server-only. Also loads the price floors; without it the site prices everything at list price (no volume or pallet discounts) |
| `NEXT_PUBLIC_APP_URL` | **yes in production** | Base URL for links in emails (quote links, account links). Production refuses to guess it from request headers |
| `STRIPE_AUTOMATIC_TAX` | no (default off) | `1` = Stripe calculates sales tax on cart checkouts |

## Sales tax (`STRIPE_AUTOMATIC_TAX=1`)
1. In the Stripe Dashboard → **Tax**: activate Stripe Tax, set the origin address (Kansas City warehouse) and add the
   states where MegaTarps is registered to collect tax. Set a default product tax code (e.g. *General – Tangible Goods*)
   and the shipping tax code.
2. Set `STRIPE_AUTOMATIC_TAX=1` and redeploy. Cart checkouts then show tax based on the shipping address, and the
   webhook stores it in `orders.tax_cents`.
3. **Tax-exempt accounts:** when an *approved* account has `tax_exempt = true` (set on `/admin/accounts/[id]` after
   checking the resale certificate), checkout uses a Stripe Customer with `tax_exempt = 'exempt'`, so Stripe charges
   no tax. If the customer later changes their tax ID or certificate, the database removes the exemption until you
   re-approve it (migration 0009).
4. **Quotes** are not taxed automatically: the tax you type on the quote is what the customer pays (avoids double tax).

## ACH (us_bank_account)
ACH takes a few business days to clear. A paid **quote** becomes `ordered` only when Stripe sends
`checkout.session.async_payment_succeeded` (card: `checkout.session.completed` with `payment_status = paid`).
Until then the order shows **ACH processing** on `/admin/orders`. Subscribe the webhook endpoint to
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
and `checkout.session.expired`.

## Net terms and credit limits
Accepting a quote on Net terms creates an invoiced order. It is refused when
`quote total + all open invoiced orders (payment_status = 'invoiced') > credit_limit_cents`.
An approved Net-terms account **without a credit limit** can't accept on terms (fail closed): set a limit on
`/admin/accounts/[id]` when you grant Net 15 / Net 30. Mark an invoice paid by setting the order's
`payment_status = 'paid'`; that frees the credit.

## /admin/orders
Filters: **All** (open + paid, hides abandoned), **Paid**, **Awaiting payment** (card checkout < 24 h, ACH processing,
Net-terms invoices) and **Abandoned > 24h** (unpaid card checkouts older than a day, expired / failed sessions).
