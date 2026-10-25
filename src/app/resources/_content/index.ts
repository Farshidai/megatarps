import type { Article } from './types'
import { milThickness } from './articles/mil-thickness'
import { roofingTarp } from './articles/roofing-tarp'
import { sizing } from './articles/sizing'
import { materials } from './articles/materials'
import { coldWeather } from './articles/cold-weather'
import { wholesale } from './articles/wholesale'

export type { Article } from './types'

/** All resource articles, in hub display order. Add new articles here. */
export const ARTICLES: Article[] = [milThickness, roofingTarp, sizing, materials, coldWeather, wholesale]

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export const CALCULATOR = {
  slug: 'tarp-size-calculator',
  path: '/resources/tarp-size-calculator',
  title: 'Tarp Size Calculator',
  description: 'Enter the area to cover and how much overhang you need. Get the right standard tarp size, allowing for finished size.',
}
