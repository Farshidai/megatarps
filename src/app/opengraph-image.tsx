import { renderOgImage, OG_ALT } from '@/components/seo/og'

export const alt = OG_ALT
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return renderOgImage()
}
