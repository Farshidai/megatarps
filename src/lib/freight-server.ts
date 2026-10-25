// Server-only: loads the freight configuration (rates + settings).
import { createClient } from '@/lib/supabase/server'
import { isDemoMode } from '@/lib/demo'
import { normalizeFreightConfig, PLACEHOLDER_FREIGHT_CONFIG, type FreightConfig } from './freight'

/**
 * Demo mode → built-in PLACEHOLDER rates. Live → freight_rates / freight_settings.
 * If the tables can't be read (migration 0006 not applied) we return NO rates, so every
 * order falls back to a freight quote instead of charging made-up numbers.
 */
export async function getFreightConfig(): Promise<FreightConfig> {
  if (isDemoMode()) return PLACEHOLDER_FREIGHT_CONFIG
  try {
    const supabase = await createClient()
    const [rates, settings] = await Promise.all([
      supabase.from('freight_rates').select('*').eq('active', true).order('sort'),
      supabase.from('freight_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    if (rates.error) throw rates.error
    if (settings.error) throw settings.error
    return normalizeFreightConfig(rates.data, settings.data)
  } catch (e) {
    console.error('getFreightConfig: falling back to quote-only freight', e)
    return { rates: [], settings: PLACEHOLDER_FREIGHT_CONFIG.settings }
  }
}
