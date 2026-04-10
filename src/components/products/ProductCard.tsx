import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'
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
      className="group bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
            <Package className="w-12 h-12" />
            <span className="text-xs text-slate-400">No image</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFireRetardant && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              🔥 FIRE RETARDANT
            </span>
          )}
          {isBulkOnly && (
            <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              BULK ONLY
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <span className="flex items-center justify-center gap-1.5 text-white text-sm font-bold">
            View Product <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Product line label */}
        {product.product_line?.name && (
          <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">
            {product.product_line.name}
          </p>
        )}

        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>

        {/* Specs pills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.thickness_mil && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {product.thickness_mil}-Mil
            </span>
          )}
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {product.width_ft}&times;{product.length_ft} ft
          </span>
          {product.color && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium border"
              style={{
                backgroundColor: product.color_hex ? `${product.color_hex}20` : '#f1f5f9',
                borderColor: product.color_hex ?? '#e2e8f0',
                color: '#475569',
              }}
            >
              {product.color}
            </span>
          )}
        </div>

        {/* Price + stock */}
        <div className="mt-auto flex items-end justify-between">
          <div>
            {product.retail_price_cents > 0 ? (
              <>
                <p className="text-lg font-black text-slate-900">
                  {formatPrice(product.retail_price_cents)}
                </p>
                <p className="text-xs text-slate-400">per unit</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-500">Quote required</p>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${product.in_stock ? 'text-green-600' : 'text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-slate-400'}`} />
            {product.in_stock ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        {/* Bulk prompt */}
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          {`${BULK_THRESHOLD}+ units? `}
          <span className="text-orange-600 font-semibold">Bulk pricing available →</span>
        </div>
      </div>
    </Link>
  )
}
