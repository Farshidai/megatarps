import { ImageResponse } from 'next/og'

// Square brand mark used as the PNG icon and as the Organization JSON-LD logo (/icon).
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderRadius: 96,
        }}
      >
        <div style={{ display: 'flex', background: '#f97316', color: 'white', fontSize: 300, fontWeight: 900, padding: '0 56px', borderRadius: 48, lineHeight: 1.2 }}>M</div>
      </div>
    ),
    size,
  )
}
