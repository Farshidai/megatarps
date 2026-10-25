// Cart / checkout constants shared by client UI and server routes.
// Freight is weight-based: see src/lib/freight.ts (rates live in freight_rates / freight_settings).

/** Hard limits enforced by /api/checkout (and mirrored in the UI). */
export const MAX_LINE_QUANTITY = 10000
export const MAX_CART_LINES = 100
