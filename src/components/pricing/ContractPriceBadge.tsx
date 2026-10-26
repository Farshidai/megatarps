import { Handshake } from 'lucide-react'
import { cn } from '@/lib/utils'

/** "Your contract price" pill, shown wherever an approved account's contract price is applied. */
export function ContractPriceBadge({ className, size = 'md', label = 'Your contract price' }: { className?: string; size?: 'sm' | 'md'; label?: string }) {
  return (
    <span
      data-testid="contract-price-badge"
      className={cn(
        'inline-flex items-center gap-1 font-bold rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 whitespace-nowrap',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        className,
      )}
    >
      <Handshake className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
      {label}
    </span>
  )
}
