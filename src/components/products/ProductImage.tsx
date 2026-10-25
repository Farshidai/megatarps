import type { CatalogProduct } from '@/lib/catalog'
import { dimsLabel, gaugeLabel, isAccessory } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import { SafeImg } from '@/components/products/SafeImg'

interface Props {
  product: CatalogProduct
  /** 'card' for grids, 'hero' for the product page */
  variant?: 'card' | 'hero' | 'thumb'
  className?: string
  imgClassName?: string
}

/**
 * Product photo, or a branded placeholder (size + mil on a tarp swatch) for the
 * supplier SKUs that don't have photography yet. Never renders a broken image.
 */
export function ProductImage({ product, variant = 'card', className, imgClassName }: Props) {
  const src = product.image_urls?.[0]
  if (src) {
    return (
      <div className={cn('relative w-full h-full', className)}>
        <ProductPlaceholder product={product} variant={variant} />
        <SafeImg
          src={src}
          alt={product.name}
          loading={variant === 'hero' ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('absolute inset-0 w-full h-full object-cover bg-slate-100', imgClassName)}
        />
      </div>
    )
  }
  return <ProductPlaceholder product={product} variant={variant} className={className} />
}

export function ProductPlaceholder({ product, variant = 'card', className }: Omit<Props, 'imgClassName'>) {
  const hex = product.color_hex ?? '#64748b'
  const dims = dimsLabel(product)
  const gauge = gaugeLabel(product)
  const acc = isAccessory(product)
  const big = variant === 'hero'
  const thumb = variant === 'thumb'
  const headline = acc ? product.size_label ?? product.name.split(' ').slice(0, 2).join(' ') : dims
  const sub = acc
    ? product.pack_quantity && product.pack_quantity > 1 ? `${product.pack_quantity}-pack` : product.accessory_type?.replace('-', ' ')
    : gauge

  return (
    <div
      role="img"
      aria-label={`${product.name} — photo coming soon`}
      className={cn('relative w-full h-full overflow-hidden bg-slate-900 text-white select-none', className)}
    >
      {/* brand glow + subtle weave texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(249_115_22_/_0.28),_transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 7px),repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 7px)',
        }}
      />
      {/* tarp swatch with grommets */}
      {!thumb && (
        <div
          className={cn(
            'absolute rounded-md shadow-2xl ring-1 ring-white/20 rotate-[-8deg]',
            big ? 'right-[12%] bottom-[14%] w-[44%] h-[34%]' : 'right-[10%] bottom-[12%] w-[46%] h-[32%]',
          )}
          style={{ background: `linear-gradient(135deg, ${hex}, ${hex}cc 55%, #0f172a66)` }}
          aria-hidden
        >
          {[['2%', '4%'], ['2%', '88%'], ['82%', '4%'], ['82%', '88%']].map(([t, l]) => (
            <span
              key={`${t}${l}`}
              className="absolute w-[7%] aspect-square rounded-full ring-2 ring-slate-200/80 bg-slate-900/40"
              style={{ top: t, left: l }}
            />
          ))}
        </div>
      )}
      <div className={cn('relative h-full flex flex-col', thumb ? 'p-1.5 justify-center items-center text-center' : big ? 'p-8 sm:p-10' : 'p-4')}>
        {!thumb && (
          <p className={cn('font-black tracking-tight text-orange-400', big ? 'text-sm' : 'text-[10px]')}>
            MEGA<span className="text-white">TARPS</span>
          </p>
        )}
        <div className={cn(!thumb && 'mt-auto mb-[38%]')}>
          {headline && (
            <p className={cn('font-black leading-none tracking-tight', thumb ? 'text-[10px]' : big ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl')}>
              {headline}
            </p>
          )}
          {sub && !thumb && (
            <p
              className={cn(
                'inline-block mt-2 font-bold uppercase tracking-wider bg-orange-500 text-white rounded',
                big ? 'text-base px-2.5 py-1' : 'text-[10px] px-1.5 py-0.5',
              )}
            >
              {sub}
            </p>
          )}
        </div>
        {!thumb && (
          <p className={cn('absolute left-0 right-0 bottom-0 text-slate-400', big ? 'px-10 pb-6 text-xs' : 'px-4 pb-2.5 text-[9px]')}>
            Photo coming soon · {product.color && product.color !== 'Standard' ? product.color : product.xpose_sku}
          </p>
        )}
      </div>
    </div>
  )
}
