// Simple per-IP rate limit: in-memory token bucket with LRU eviction.
// BEST-EFFORT ONLY: on serverless (Vercel) every instance has its own memory and instances
// come and go, so a determined attacker spread over instances gets more than the limit. It
// still stops a single client hammering one warm instance (chat cost, form spam). For a hard
// limit use a shared store (e.g. Upstash Redis / Vercel KV) behind the same function.

export interface RateLimitRule {
  /** bucket size: requests allowed in a burst */
  capacity: number
  /** tokens added per second (capacity / window) */
  refillPerSec: number
}

/** Named limits per endpoint. */
export const RATE_LIMITS = {
  chat: { capacity: 12, refillPerSec: 12 / 60 }, // 12 / minute
  rfq: { capacity: 5, refillPerSec: 5 / 600 }, // 5 / 10 minutes
  apply: { capacity: 5, refillPerSec: 5 / 3600 }, // 5 / hour
  contact: { capacity: 5, refillPerSec: 5 / 600 },
  newsletter: { capacity: 5, refillPerSec: 5 / 600 },
} satisfies Record<string, RateLimitRule>

interface Bucket {
  tokens: number
  updated: number
}

const MAX_KEYS = 5000

export class TokenBucketLimiter {
  private buckets = new Map<string, Bucket>()
  private maxKeys: number
  constructor(maxKeys = MAX_KEYS) {
    this.maxKeys = maxKeys
  }

  /** Takes one token. Returns ok + seconds until the next token when limited. */
  take(key: string, rule: RateLimitRule, now = Date.now()): { ok: boolean; retryAfterSec: number; remaining: number } {
    const prev = this.buckets.get(key)
    let tokens = rule.capacity
    if (prev) {
      tokens = Math.min(rule.capacity, prev.tokens + ((now - prev.updated) / 1000) * rule.refillPerSec)
      this.buckets.delete(key) // re-insert → most recently used at the end (LRU)
    }
    const ok = tokens >= 1
    if (ok) tokens -= 1
    this.buckets.set(key, { tokens, updated: now })
    while (this.buckets.size > this.maxKeys) this.buckets.delete(this.buckets.keys().next().value!)
    return { ok, retryAfterSec: ok ? 0 : Math.ceil((1 - tokens) / rule.refillPerSec), remaining: Math.floor(tokens) }
  }

  get size() {
    return this.buckets.size
  }
}

const shared = new TokenBucketLimiter()

/** Client IP from the proxy headers (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return fwd || headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Returns a 429 Response when this IP is over the limit for `name`, else null.
 * Usage: `const limited = rateLimit(request, 'chat'); if (limited) return limited`
 */
export function rateLimit(request: Request, name: keyof typeof RATE_LIMITS): Response | null {
  const r = shared.take(`${name}:${clientIp(request.headers)}`, RATE_LIMITS[name])
  if (r.ok) return null
  return Response.json(
    { error: 'Too many requests. Please wait a moment and try again.' },
    { status: 429, headers: { 'Retry-After': String(r.retryAfterSec) } },
  )
}
