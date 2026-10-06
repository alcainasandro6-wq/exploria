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

// ---------------------------------------------------------------------------
// Bookings (POST /booking/getbookings)
// ---------------------------------------------------------------------------

export interface TuriTopBooking {
  id: string
  productId: string
  productName: string
  /** Local date YYYY-MM-DD. */
  date: string
  /** Local time HH:MM. */
  time: string
  /** Date the booking was made (YYYY-MM-DD). */
  bookedOn: string
  participants: number
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  total: number
  currency: string
  source: string
}

interface TTBooking {
  short_id: string
  product_short_id: string
  product_name: string
  date_event_iso8601?: string
  date_booking_iso8601?: string
  date_event: number
  status?: string
  source?: string
  currency?: string
  total_price?: string
  client_data?: { name?: string; email?: string; phone?: string }
  ticket_type_count?: { count?: number; seats?: number }[]
}

/** Bookings whose EVENT date falls in [from, to] (YYYY-MM-DD, inclusive). */
export async function getTuriTopBookings(apiKey: string, from: string, to: string, maxPages = 10): Promise<TuriTopBooking[]> {
  const start = Math.floor(new Date(`${from}T00:00:00Z`).getTime() / 1000) - 12 * 3600
  const end = Math.floor(new Date(`${to}T23:59:59Z`).getTime() / 1000) + 12 * 3600
  const out: TuriTopBooking[] = []

  for (let page = 1; page <= maxPages; page++) {
    const res = await ttPost<{ bookings?: TTBooking[] | Record<string, TTBooking>; pagination?: { has_more?: boolean } }>(
      apiKey,
      '/booking/getbookings',
      { filter: { event_date_from: start, event_date_to: end, booking_limit: 100, booking_page: page } }
    )
    const raw = res.data?.bookings ?? []
    const list: TTBooking[] = Array.isArray(raw) ? raw : Object.values(raw)
    for (const b of list) {
      const iso = b.date_event_iso8601 ?? ''
      const date = iso.slice(0, 10)
      if (!date || date < from || date > to) continue
      out.push({
        id: b.short_id,
        productId: b.product_short_id,
        productName: decodeHtmlEntities(b.product_name ?? b.product_short_id),
        date,
        time: iso.slice(11, 16),
        bookedOn: (b.date_booking_iso8601 ?? '').slice(0, 10),
        participants: (b.ticket_type_count ?? []).reduce((s, t) => s + (t.count ?? 0), 0),
        customerName: decodeHtmlEntities(b.client_data?.name ?? ''),
        customerEmail: b.client_data?.email ?? '',
        customerPhone: b.client_data?.phone ?? '',
        status: b.status ?? 'pending',
        total: Number(b.total_price ?? 0),
        currency: b.currency ?? 'EUR',
        source: b.source ?? '',
      })
    }
    if (!res.data?.pagination?.has_more) break
  }
  return out
}

// ---------------------------------------------------------------------------
// Import: product details + cheapest ticket price (POST /product/getproducts
// with product_short_id, POST /tickets/get)
// ---------------------------------------------------------------------------

export interface TuriTopImportData {
  id: string
  title: string
  summary: string
  description: string
  durationMinutes: number
  city: string
  latitude: number | null
  longitude: number | null
  priceFrom: number
  maxParticipants: number
}

interface TTProductDetail extends TTProduct {
  summary?: string
  description?: string
  duration?: string | number
  location_name?: string
  coordinates?: string
}

export async function getTuriTopImportData(apiKey: string, productId: string): Promise<TuriTopImportData> {
  const [p, t] = await Promise.all([
    ttPost<{ product?: TTProductDetail }>(apiKey, '/product/getproducts', { product_short_id: productId, language_code: 'es' }),
    ttPost<{ tickets?: Record<string, { price?: string; tickets_max?: string; is_addon?: string; seats?: string }> }>(apiKey, '/tickets/get', { product_short_id: productId }),
  ])
  const prod = p.data?.product
  if (!prod) throw new Error(`Producto ${productId} no encontrado`)

  const tickets = Object.values(t.data?.tickets ?? {}).filter((x) => x.is_addon !== '1')
  const prices = tickets.map((x) => Number(x.price ?? 0)).filter((n) => n > 0)
  const maxP = tickets.map((x) => Number(x.tickets_max ?? 0)).filter((n) => n > 0)
  const [lat, lng] = (prod.coordinates ?? '').split(',').map((v) => parseFloat(v))

  const summary = decodeHtmlEntities(prod.summary ?? '')
  return {
    id: prod.short_id,
    title: decodeHtmlEntities(prod.name),
    summary,
    description: decodeHtmlEntities(prod.description ?? '') || summary || decodeHtmlEntities(prod.name),
    durationMinutes: Number(prod.duration) || 60,
    city: decodeHtmlEntities(prod.location_name ?? '') || 'Torrevieja',
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    priceFrom: prices.length ? Math.min(...prices) : 0,
    maxParticipants: maxP.length ? Math.max(...maxP) : 10,
  }
}

// ---------------------------------------------------------------------------
// Real departures (slots) of a product on a given day
// ---------------------------------------------------------------------------

export interface TuriTopSlot {
  /** Local time HH:MM. */
  time: string
  /** Unix timestamp of the departure (what booking/insert needs). */
  timestamp: number
  /** Seats still available. */
  left: number
  /** Ticket used for bookings made from Exploria (1 seat per ticket). */
  ticketId: number | null
  ticketName: string
  price: number
}

interface TTSlotEvent extends TTCalendarEvent {
  products: (TTCalendarEvent['products'][number] & {
    tickets?: { id: number; name: string; seats: number; left: number; addon?: boolean }[]
  })[]
}

/** Open departures with seats left for one product on one local date. */
export async function getTuriTopSlots(apiKey: string, productId: string, date: string): Promise<TuriTopSlot[]> {
  const start = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) - 12 * 3600
  const end = Math.floor(new Date(`${date}T23:59:59Z`).getTime() / 1000) + 12 * 3600
  const [cal, tick] = await Promise.all([
    ttPost<{ events?: TTSlotEvent[] }>(apiKey, '/product/getcalendardata', { product_short_ids: [productId], start_date: start, end_date: end }),
    ttPost<{ tickets?: Record<string, { price?: string; is_addon?: string; seats?: string; visibility?: string }> }>(apiKey, '/tickets/get', { product_short_id: productId }),
  ])
  const prices = tick.data?.tickets ?? {}

  const slots: TuriTopSlot[] = []
  for (const ev of cal.data?.events ?? []) {
    const p = ev.products?.find((x) => x.short_id === productId)
    if (!p || p.status?.status === 'closed') continue
    if ((ev.time_iso8601 ?? '').slice(0, 10) !== date) continue
    const left = p.seats?.left ?? 0
    if (left <= 0) continue

    // Cheapest bookable single-seat ticket with seats left.
    const candidates = (p.tickets ?? [])
      .filter((t) => !t.addon && t.seats === 1 && t.left > 0 && prices[String(t.id)] && prices[String(t.id)].visibility !== 'none')
      .map((t) => ({ t, price: Number(prices[String(t.id)].price ?? 0) }))
      .sort((a, b) => a.price - b.price)
    const best = candidates[0]
    slots.push({
      time: (ev.time_iso8601 ?? '').slice(11, 16),
      timestamp: ev.time,
      left: best ? Math.min(left, best.t.left) : left,
      ticketId: best?.t.id ?? null,
      ticketName: best ? decodeHtmlEntities(best.t.name) : '',
      price: best?.price ?? 0,
    })
  }
  return slots.sort((a, b) => a.time.localeCompare(b.time))
}

// ---------------------------------------------------------------------------
// Writing bookings (mirror Exploria reservations into the provider's TuriTop)
// ---------------------------------------------------------------------------

export interface CreateTuriTopBookingInput {
  productId: string
  eventStart: number
  ticketId: number
  quantity: number
  status: 'pending' | 'paid'
  totalPrice: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  language?: string
  notes?: string
}

/** Creates the booking in TuriTop (holds the seats). Returns its short_id. */
export async function createTuriTopBooking(apiKey: string, b: CreateTuriTopBookingInput): Promise<string> {
  const res = await ttPost<{ booking?: { short_id?: string } }>(apiKey, '/booking/tour/insert', {
    product_short_id: b.productId,
    override_client_data: true,
    booking: {
      event_start: b.eventStart,
      ticket_type_count: { [String(b.ticketId)]: b.quantity },
      status: b.status,
      payment_gateway: 'stripe',
      total_price: b.totalPrice,
      payment_partial: b.status === 'paid' ? b.totalPrice : 0,
      language_code: b.language || 'es',
      client_data: {
        name: b.customerName || 'Exploria customer',
        email: b.customerEmail,
        ...(b.customerPhone ? { phone: b.customerPhone } : {}),
      },
      notes: b.notes ?? 'Exploria',
      send_booking_email: false,
    },
  })
  const id = res.data?.booking?.short_id
  if (!id) throw new Error('TuriTop did not return a booking id')
  return id
}

export async function setTuriTopBookingStatus(apiKey: string, shortId: string, status: 'pending' | 'paid'): Promise<void> {
  await ttPost(apiKey, '/booking/tour/edit', {
    short_id: shortId,
    override_client_data: true,
    booking: { status },
  })
}

/** Soft-deletes the booking (frees the seats). Reversible from TuriTop's panel. */
export async function deleteTuriTopBooking(apiKey: string, shortId: string): Promise<void> {
  await ttPost(apiKey, '/booking/delete', { short_id: shortId })
}
