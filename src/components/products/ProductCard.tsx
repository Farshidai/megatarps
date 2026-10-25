import Link from 'next/link'
import { Package, ArrowUpRight, Flame } from 'lucide-react'
import { formatPrice, BULK_THRESHOLD } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.image_urls?.[0]
  const isFireRetardant = product.product_line?.fire_retardant
  const isBulkOnly = product.retail_price_cents === 0

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative bg-white rounded-2xl ring-1 ring-slate-200/70 hover:ring-orange-300 hover:shadow-[0_8px_30px_-10px_rgb(249_115_22_/_0.25)] transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
            <Package className="w-10 h-10" strokeWidth={1.5} />
            <span className="text-[11px] uppercase tracking-wider text-slate-400">No image</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isFireRetardant && (
            <span className="inline-flex items-center gap-1 bg-red-600/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
              <Flame className="w-3 h-3" /> Fire Retardant
            </span>
          )}
          {isBulkOnly && (
            <span className="inline-flex items-center bg-slate-900/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
              Bulk Only
            </span>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
          <ArrowUpRight className="w-4 h-4" />
        </div>

        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {product.product_line?.name && (
          <p className="text-[10px] text-orange-600 font-bold uppercase tracking-[0.12em] mb-1.5">
            {product.product_line.name}
          </p>
        )}

        <h3 className="text-[15px] font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2 mb-3 min-h-[2.6rem]">
          {product.name}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {product.thickness_mil && (
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
              {product.thickness_mil}-Mil
            </span>
          )}
          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
            {product.width_ft}&times;{product.length_ft} ft
          </span>
          {product.color && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1"
              style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
            >
              <span
                className="w-2 h-2 rounded-full ring-1 ring-slate-300"
                style={{ backgroundColor: product.color_hex ?? '#94a3b8' }}
              />
              {product.color}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            {product.retail_price_cents > 0 ? (
              <>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">From</p>
                <p className="text-xl font-black text-slate-900 leading-none">
                  {formatPrice(product.retail_price_cents)}
                </p>
              </>
            ) : (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Bulk pricing</p>
                <p className="text-sm font-bold text-orange-600">Quote required</p>
              </div>
            )}
          </div>
          {product.in_stock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Backorder
            </span>
          )}
        </div>

        {!isBulkOnly && (
          <p className="mt-2.5 text-[11px] text-slate-400 leading-relaxed">
            {BULK_THRESHOLD}+ units?{' '}
            <span className="text-orange-600 font-semibold group-hover:underline">Bulk pricing →</span>
          </p>
        )}
      </div>
    </Link>
  )
}
