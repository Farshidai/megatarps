// Pure helpers for the pricing-rules admin (validation + sanity warnings). No pricing math here.
import type { PricingRule } from '@/lib/pricing'

export const RULE_TARP_TYPES = ['poly', 'canvas', 'mesh', 'clear-vinyl', 'accessory'] as const

export interface RuleInput {
  tarp_type: string | null
  thickness_mil: number | null
  min_quantity: number
  max_quantity: number | null
  discount_from_retail_percent: number
  priority: number
  active: boolean
}

export function validateRule(raw: unknown): { ok: true; rule: RuleInput } | { ok: false; error: string } {
  const r = (raw ?? {}) as Record<string, unknown>
  const int = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))
  const tarp_type = r.tarp_type ? String(r.tarp_type) : null
  if (tarp_type && !(RULE_TARP_TYPES as readonly string[]).includes(tarp_type)) return { ok: false, error: 'Unknown tarp type.' }
  const thickness_mil = int(r.thickness_mil)
  if (thickness_mil !== null && (!Number.isInteger(thickness_mil) || thickness_mil < 1 || thickness_mil > 100)) return { ok: false, error: 'Thickness must be a whole number of mil (or Any).' }
  const min_quantity = int(r.min_quantity)
  if (min_quantity === null || !Number.isInteger(min_quantity) || min_quantity < 1 || min_quantity > 1_000_000) return { ok: false, error: 'Min quantity must be a whole number ≥ 1.' }
  const max_quantity = int(r.max_quantity)
  if (max_quantity !== null && (!Number.isInteger(max_quantity) || max_quantity < min_quantity)) return { ok: false, error: 'Max quantity must be empty (no limit) or ≥ min quantity.' }
  const discount = Number(r.discount_from_retail_percent)
  if (!Number.isFinite(discount) || discount < 0 || discount > 90) return { ok: false, error: 'Discount must be between 0 and 90%.' }
  const priority = int(r.priority) ?? 0
  if (!Number.isInteger(priority) || priority < -100 || priority > 100) return { ok: false, error: 'Priority must be a whole number between -100 and 100.' }
  return {
    ok: true,
    rule: { tarp_type, thickness_mil, min_quantity, max_quantity, discount_from_retail_percent: Math.round(discount * 100) / 100, priority, active: r.active !== false },
  }
}

export const scopeLabel = (r: Pick<PricingRule, 'tarp_type' | 'thickness_mil'>) =>
  `${r.tarp_type ?? 'All types'}${r.thickness_mil ? ` · ${r.thickness_mil} mil` : ''}`

/** Gaps / overlaps / non-increasing discounts within each scope — these silently produce odd prices. */
export function ruleWarnings(rules: PricingRule[]): string[] {
  const warnings: string[] = []
  const groups = new Map<string, PricingRule[]>()
  for (const r of rules.filter((r) => r.active !== false)) {
    const k = scopeLabel(r)
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  for (const [scope, list] of groups) {
    const sorted = [...list].sort((a, b) => a.min_quantity - b.min_quantity)
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i]
      if (prev.max_quantity == null) warnings.push(`${scope}: ${prev.min_quantity}+ has no max, so it overlaps ${cur.min_quantity}+.`)
      else if (cur.min_quantity <= prev.max_quantity) warnings.push(`${scope}: ${prev.min_quantity}–${prev.max_quantity} overlaps ${cur.min_quantity}–${cur.max_quantity ?? '∞'}.`)
      else if (cur.min_quantity > prev.max_quantity + 1) warnings.push(`${scope}: gap between ${prev.max_quantity} and ${cur.min_quantity} — quantities ${prev.max_quantity + 1}–${cur.min_quantity - 1} pay full retail.`)
      if (Number(cur.discount_from_retail_percent ?? 0) < Number(prev.discount_from_retail_percent ?? 0)) warnings.push(`${scope}: discount drops from ${prev.discount_from_retail_percent}% to ${cur.discount_from_retail_percent}% at ${cur.min_quantity} units.`)
    }
  }
  return warnings
}
