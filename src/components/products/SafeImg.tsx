'use client'

import { useEffect, useRef, useState } from 'react'

/** <img> that removes itself if it fails to load, revealing the placeholder rendered beneath it. */
export function SafeImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    // the error may have fired before hydration
    const img = ref.current
    if (img && img.complete && img.naturalWidth === 0) img.style.display = 'none'
  }, [])
  if (failed) return null
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img ref={ref} {...props} onError={() => setFailed(true)} />
}
