// Real TuriTop API connection (OCTO standard — https://developers.turitop.com/),
// distinct from the public embed widget in TuriTopWidget.tsx. Each provider
// pastes their own API key (from TuriTop support, help@turitop.com), so every
// provider gets their own independent calendar connection.
//
// Base URL and Bearer-auth scheme: https://app.turitop.com/octo/products
// OCTO endpoints used here: GET /products, POST /availability/calendar.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

const TURITOP_API_BASE = 'https://app.turitop.com/octo'

export interface TuriTopConnectionResult {
  status: 'ok' | 'error'
  error: string | null
}

export interface TuriTopProduct {
  id: string
  name: string
  optionId: string | null
}

export interface TuriTopDayAvailability {
  /** YYYY-MM-DD */
  date: string
  available: boolean
  /** Remaining places, when TuriTop reports it. */
  vacancies: number | null
  status: string
}

export async function testTuriTopConnection(apiKey: string): Promise<TuriTopConnectionResult> {
  if (!apiKey.trim()) {
    return { status: 'error', error: 'API key vacía' }
  }

  try {
    const res = await fetch(`${TURITOP_API_BASE}/products`, {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })

    if (res.ok) return { status: 'ok', error: null }

    if (res.status === 401 || res.status === 403) {
      return { status: 'error', error: 'API key inválida o rechazada por TuriTop' }
    }
    return { status: 'error', error: `TuriTop respondió con un error (HTTP ${res.status})` }
  } catch (err) {
    return { status: 'error', error: `No se pudo contactar con TuriTop: ${(err as Error).message}` }
  }
}

/** Stores (or clears) the provider's API key in the private credentials table.
 *  Returns an error message, or null on success. */
export async function saveTuriTopKey(
  supabase: SupabaseClient,
  providerId: string,
  apiKey: string
): Promise<string | null> {
  const key = apiKey.trim()
  if (!key) {
    const { error } = await supabase.from('provider_turitop_credentials').delete().eq('provider_id', providerId)
    return error?.message ?? null
  }
  const { error } = await supabase
    .from('provider_turitop_credentials')
    .upsert({ provider_id: providerId, api_key: key, updated_at: new Date().toISOString() })
  return error?.message ?? null
}

/** Server-only: reads a provider's key with the service role. Callers MUST
 *  have verified the caller owns the provider (or is admin) beforehand. */
export async function getTuriTopKey(providerId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('provider_turitop_credentials')
    .select('api_key')
    .eq('provider_id', providerId)
    .maybeSingle()
  return (data?.api_key as string | undefined) ?? null
}

async function octoFetch<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TURITOP_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`TuriTop HTTP ${res.status}`)
  return (await res.json()) as T
}

interface OctoProduct {
  id: string
  internalName?: string
  title?: string
  options?: { id: string; default?: boolean }[]
}

export async function listTuriTopProducts(apiKey: string): Promise<TuriTopProduct[]> {
  const products = await octoFetch<OctoProduct[]>(apiKey, '/products')
  return (Array.isArray(products) ? products : []).map((p) => ({
    id: p.id,
    name: p.internalName || p.title || p.id,
    optionId: p.options?.find((o) => o.default)?.id ?? p.options?.[0]?.id ?? null,
  }))
}

interface OctoCalendarDay {
  localDate: string
  available: boolean
  status?: string
  vacancies?: number | null
}

/** Day-by-day availability of one product for a date range (OCTO
 *  POST /availability/calendar). Dates are YYYY-MM-DD. */
export async function getTuriTopCalendar(
  apiKey: string,
  productId: string,
  optionId: string | null,
  from: string,
  to: string
): Promise<TuriTopDayAvailability[]> {
  const days = await octoFetch<OctoCalendarDay[]>(apiKey, '/availability/calendar', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      optionId: optionId ?? 'DEFAULT',
      localDateStart: from,
      localDateEnd: to,
    }),
  })
  return (Array.isArray(days) ? days : []).map((d) => ({
    date: d.localDate,
    available: !!d.available,
    vacancies: typeof d.vacancies === 'number' ? d.vacancies : null,
    status: d.status ?? (d.available ? 'AVAILABLE' : 'SOLD_OUT'),
  }))
}
