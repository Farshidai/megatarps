import { renderOgImage } from '@/components/seo/og'
import { ARTICLES, getArticle } from '../_content'

export const alt = 'MegaTarps resource guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export default async function ArticleOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = getArticle(slug)
  return renderOgImage({
    eyebrow: a ? `${a.topic} guide` : 'Resource guide',
    title: a?.title ?? 'MegaTarps resources',
    footer: "The contractor's tarp supplier",
  })
}
