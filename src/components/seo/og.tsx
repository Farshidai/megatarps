import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_ALT = 'MegaTarps: wholesale heavy-duty tarps with case and pallet pricing and Midwest freight'

/**
 * Shared social card renderer (used by opengraph-image and twitter-image, and by
 * per-article cards). Pure CSS so it needs no image assets or custom fonts.
 */
export function renderOgImage({
  eyebrow = 'Wholesale heavy-duty tarps',
  title = 'The right mil. The right size. By the pallet.',
  footer = '5–20 mil poly · canvas · mesh · clear vinyl · fire-retardant',
}: { eyebrow?: string; title?: string; footer?: string } = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0f172a 0%, #0f172a 55%, #1e293b 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', right: 0, top: 0, width: 24, height: '100%', background: '#f97316', display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#f97316', color: 'white', fontSize: 40, fontWeight: 900, padding: '6px 18px', borderRadius: 8, display: 'flex' }}>MEGA</div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 2, display: 'flex' }}>TARPS</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1000 }}>
          <div style={{ color: '#fdba74', fontSize: 28, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, display: 'flex' }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 58 : 72, fontWeight: 900, lineHeight: 1.05, display: 'flex' }}>{title}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: '#cbd5e1', fontSize: 26 }}>
          <div style={{ display: 'flex' }}>{footer}</div>
          <div style={{ display: 'flex', color: '#f97316', fontWeight: 800 }}>megatarps.com</div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
