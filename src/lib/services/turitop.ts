// TuriTop's own REST API (https://developers.turitop.com/ — spec at
// /turitop_api.yaml). It is NOT the OCTO standard: every call is a JSON POST
// under /v1, and authentication is either OAuth2 (short_id + secret_key →
// IP-bound access token) or plain Bearer auth with the company's secret key.
//
// We use Bearer auth: "Authorization: Bearer <secret key>" and no access_token
// in the body. It does no IP verification, which is what serverless hosting
// (Vercel, rotating IPs) needs. Every provider has their own key, so every
// provider gets their own independent calendar connection.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

const TURITOP_API_BASE = 'https://app.turitop.com/v1'

export interface TuriTopConnectionResult {
  status: 'ok' | 'error'
  error: string | null
}

export interface TuriTopProduct {
  /** TuriTop product short_id, e.g. "P12". */
  id: string
  name: string
  optionId: string | null
}

export interface TuriTopDayAvailability {
  /** Product short_id. */
  productId: string
  /** Local date YYYY-MM-DD. */
  date: string
  available: boolean
  /** Total seats left across the day's open departures. */
  vacancies: number
  /** Number of open departures that day. */
  departures: number
}

interface TuriTopEnvelope<T> {
  data?: T
  status?: string
  code?: number | string
  message?: string
  details?: string
}

// TuriTop returns names HTML-escaped ("Catamar&aacute;n"). Decode for display.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', agrave: 'à', egrave: 'è',
  ccedil: 'ç', Ccedil: 'Ç', ordm: 'º', ordf: 'ª', iexcl: '¡', iquest: '¿',
}
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m)
    .trim()
}

async function ttPost<T>(apiKey: string, path: string, data?: Record<string, unknown>): Promise<TuriTopEnvelope<T>> {
  const res = await fetch(`${TURITOP_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data ? { data } : {}),
    signal: AbortSignal.timeout(25_000),
    cache: 'no-store',
  })
  let body: TuriTopEnvelope<T> | null = null
  try { body = (await res.json()) as TuriTopEnvelope<T> } catch { /* non-JSON error page */ }

  if (res.status === 401 || res.status === 403) throw new TuriTopAuthError()
  if (!res.ok || (body?.status && body.status !== 'SUCCESS')) {
    throw new Error(body?.details || body?.message || `TuriTop HTTP ${res.status}`)
  }
  return body ?? {}
}

class TuriTopAuthError extends Error {
  constructor() { super('API key inválida o rechazada por TuriTop') }
}

export async function testTuriTopConnection(apiKey: string): Promise<TuriTopConnectionResult> {
  if (!apiKey.trim()) return { status: 'error', error: 'API key vacía' }
  try {
    await ttPost(apiKey, '/product/getproducts', {})
    return { status: 'ok', error: null }
  } catch (err) {
    if (err instanceof TuriTopAuthError) return { status: 'error', error: err.message }
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

interface TTProduct { short_id: string; name: string; disabled?: boolean }

export async function listTuriTopProducts(apiKey: string): Promise<TuriTopProduct[]> {
  const res = await ttPost<{ products?: TTProduct[] }>(apiKey, '/product/getproducts', { language_code: 'es' })
  return (res.data?.products ?? [])
    .filter((p) => !p.disabled)
    .map((p) => ({ id: p.short_id, name: decodeHtmlEntities(p.name || p.short_id), optionId: null }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

interface TTCalendarEvent {
  time: number
  time_iso8601?: string
  products: {
    short_id: string
    timezone?: string
    status?: { status?: 'open' | 'closed' }
    seats?: { total?: number; reserved?: number; left?: number }
  }[]
}

function localDate(e: TTCalendarEvent, tz?: string): string {
  // time_iso8601 already carries the local date ("2026-10-06T18:30:00+0200").
  if (e.time_iso8601) return e.time_iso8601.slice(0, 10)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'Europe/Madrid' }).format(new Date(e.time * 1000))
}

/** Day-by-day availability for the given products over [from, to]
 *  (YYYY-MM-DD, inclusive), using POST /product/getcalendardata. */
export async function getTuriTopCalendar(
  apiKey: string,
  productIds: string[],
  from: string,
  to: string
): Promise<TuriTopDayAvailability[]> {
  if (productIds.length === 0) return []
  const start = Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000) - 12 * 3600
  const end = Math.floor(new Date(`${to}T23:59:59Z`).getTime() / 1000) + 12 * 3600

  const days = new Map<string, TuriTopDayAvailability>()
  // Keep each call small: TuriTop computes this live and big ranges are slow.
  for (let i = 0; i < productIds.length; i += 5) {
    const chunk = productIds.slice(i, i + 5)
    const res = await ttPost<{ events?: TTCalendarEvent[] }>(apiKey, '/product/getcalendardata', {
      product_short_ids: chunk,
      start_date: start,
      end_date: end,
    })
    for (const ev of res.data?.events ?? []) {
      for (const p of ev.products ?? []) {
        const date = localDate(ev, p.timezone)
        if (date < from || date > to) continue
        const key = `${p.short_id}|${date}`
        const cur = days.get(key) ?? { productId: p.short_id, date, available: false, vacancies: 0, departures: 0 }
        if (p.status?.status !== 'closed') {
          const left = p.seats?.left ?? 0
          if (left > 0) {
            cur.available = true
            cur.vacancies += left
            cur.departures += 1
          }
        }
        days.set(key, cur)
      }
    }
  }
  return [...days.values()]
}
