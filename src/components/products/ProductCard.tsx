import Link from 'next/link'
import { Package, CheckCircle, XCircle } from 'lucide-react'
import { formatPrice, BULK_THRESHOLD } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.image_urls?.[0]

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-lg transition-all overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-slate-300" />
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-slate-800 text-white text-sm font-bold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.product_line?.fire_retardant && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            FIRE RETARDANT
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1 mt-1 mb-3">
          {product.thickness_mil && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {product.thickness_mil}-Mil
            </span>
          )}
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {product.width_ft}x{product.length_ft} ft
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium border"
            style={{
              backgroundColor: product.color_hex ? `${product.color_hex}20` : '#f1f5f9',
              borderColor: product.color_hex ?? '#cbd5e1',
              color: product.color_hex ?? '#475569',
            }}
          >
            {product.color}
          </span>
        </div>

        <div className="mt-auto">
          <div className="flex items-end justify-between">
            <div>
              {product.retail_price_cents > 0 ? (
                <p className="text-xl font-black text-slate-900">
                  {formatPrice(product.retail_price_cents)}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">Price on request</p>
              )}
              <p className="text-xs text-slate-400">per unit</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {product.in_stock ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" /> In Stock
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <XCircle className="w-3 h-3" /> Out of Stock
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-orange-600 font-semibold">
            5+ units? → Bulk pricing available
          </div>
        </div>
      </div>
    </Link>
  )
}
