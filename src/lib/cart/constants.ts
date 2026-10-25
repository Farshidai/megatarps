// Cart / checkout constants shared by client UI and server routes.

/** Orders whose priced subtotal reaches this ship free (matches the navbar banner). */
export const FREE_FREIGHT_THRESHOLD_CENTS = 19900

/** Flat standard freight below the free-freight threshold. Confirm with Farshid before launch. */
export const STANDARD_FREIGHT_CENTS = 1495

/** Hard limits enforced by /api/checkout (and mirrored in the UI). */
export const MAX_LINE_QUANTITY = 10000
export const MAX_CART_LINES = 100
