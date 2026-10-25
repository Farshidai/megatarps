import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/products'
import { CATEGORY_LABELS } from '@/lib/utils'
import { ARTICLES, CALCULATOR } from './resources/_content'
import { SITE_URL } from '@/lib/site'

// Regenerate at most hourly so new products show up without a deploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const url = (path: string) => `${SITE_URL}${path}`

  const staticPages: MetadataRoute.Sitemap = [
    { url: url('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: url('/products'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: url('/apply'), changeFrequency: 'monthly', priority: 0.8 },
    { url: url('/bulk-quote'), changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/quick-order'), changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/resources'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: url(CALCULATOR.path), changeFrequency: 'monthly', priority: 0.7 },
    { url: url('/about'), changeFrequency: 'yearly', priority: 0.5 },
    { url: url('/contact'), changeFrequency: 'yearly', priority: 0.5 },
    { url: url('/shipping'), changeFrequency: 'yearly', priority: 0.4 },
    { url: url('/returns'), changeFrequency: 'yearly', priority: 0.4 },
    { url: url('/terms'), changeFrequency: 'yearly', priority: 0.2 },
    { url: url('/privacy'), changeFrequency: 'yearly', priority: 0.2 },
  ]

  const categories: MetadataRoute.Sitemap = Object.keys(CATEGORY_LABELS).map((slug) => ({
    url: url(`/products/${slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const articles: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: url(`/resources/${a.slug}`),
    lastModified: new Date(`${a.updated}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // getProducts() falls back to demo data when Supabase isn't configured.
  let products: MetadataRoute.Sitemap = []
  try {
    products = (await getProducts()).map((p) => ({
      url: url(`/product/${p.slug}`),
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch (e) {
    console.error('sitemap: product load failed', e)
  }

  return [...staticPages, ...categories, ...articles, ...products]
}
