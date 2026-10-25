import type { ReactNode } from 'react'

export interface ShopLink {
  label: string
  href: string
  note?: string
}

export interface Article {
  slug: string
  /** H1 and default <title> (template adds " | MegaTarps"). */
  title: string
  /** Short label for nav/footer links. */
  shortTitle: string
  /** Optional shorter <title> if the H1 is long. */
  metaTitle?: string
  /** Meta description, 140–160 chars. */
  description: string
  /** One-paragraph summary shown on the hub card and under the H1. */
  excerpt: string
  topic: 'Materials' | 'Sizing' | 'Roofing' | 'Cold weather' | 'Wholesale'
  /** ISO dates. */
  published: string
  updated: string
  readingMinutes: number
  /** In-page table of contents: ids must match <H2 id>. */
  toc: { id: string; label: string }[]
  /** Product category / job links shown in the "Shop for this job" box. */
  shop: ShopLink[]
  /** Slugs of related articles. */
  related: string[]
  body: () => ReactNode
}
