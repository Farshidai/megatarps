import { Truck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { FREE_FREIGHT_THRESHOLD_CENTS } from '@/lib/cart/constants'

export function FreeFreightBar({ toFreeFreight, progress }: { toFreeFreight: number; progress: number }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
      <p className="text-xs text-slate-700 flex items-center gap-1.5">
        <Truck className="w-4 h-4 text-orange-500" aria-hidden />
        {toFreeFreight > 0 ? (
          <span>
            Add <strong>{formatPrice(toFreeFreight)}</strong> more for <strong>free freight</strong> (orders over {formatPrice(FREE_FREIGHT_THRESHOLD_CENTS)})
          </span>
        ) : (
          <span className="font-semibold text-green-700">Your order ships free</span>
        )}
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-label="Progress to free freight" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </div>
  )
}
