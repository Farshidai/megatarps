import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatPriceRaw(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `MQ-${year}-${rand}`
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `MO-${year}-${rand}`
}

export const CATEGORY_LABELS: Record<string, string> = {
  'construction-roofing': 'Construction & Roofing',
  'agriculture-farming': 'Agriculture & Farming',
  'industrial-warehouse': 'Industrial & Warehouse',
  'general-purpose': 'General Purpose',
}

export const TARP_TYPE_LABELS: Record<string, string> = {
  poly: 'Poly Tarps',
  canvas: 'Canvas Tarps',
  'clear-vinyl': 'Clear Vinyl Tarps',
  mesh: 'Mesh Tarps',
  'fire-retardant': 'Fire Retardant Tarps',
}

export const THICKNESS_LABELS: Record<number, string> = {
  5: '5-Mil Multipurpose',
  10: '10-Mil Heavy Duty',
  12: '12-Mil Extra Heavy Duty',
  16: '16-Mil Super Heavy Duty',
  20: '20-Mil Ultra Heavy Duty',
}

export const BULK_THRESHOLD = 5 // orders of 5+ go to RFQ
