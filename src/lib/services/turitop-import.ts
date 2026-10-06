import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTuriTopKey,
  getTuriTopBookings,
  getTuriTopImportData,
  type TuriTopBooking,
} from '@/lib/services/turitop'

// Mirrors a provider's TuriTop bookings into the `reservations` table
// (migration 028) so they count in every Exploria statistic, list and calendar.
// Idempotent: rows are keyed by (provider_id, external_id = TuriTop short_id).

const WINDOW_DAYS = 400
const DEFAULT_MAX_AGE_MS = 5 * 60_000

export interface TuriTopSyncResult {
  ok: boolean
  skipped?: boolean
  imported: number
  updated: number
  cancelled: number
  error?: string
}

type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10)
}

function mapStatus(b: TuriTopBooking, today: string): { status: ReservationStatus; payment: 'paid' | 'unpaid' | 'refunded' } {
  switch (b.status) {
    case 'paid':
    case 'confirmed':
      return { status: b.date < today ? 'completed' : 'confirmed', payment: 'paid' }
    case 'partially paid':
      return { status: b.date < today ? 'completed' : 'confirmed', payment: 'unpaid' }
    case 'refunded':
      return { status: 'cancelled', payment: 'refunded' }
    case 'cancelled':
    case 'declined':
      return { status: 'cancelled', payment: 'unpaid' }
    case 'not done':
      return { status: 'no_show', payment: 'unpaid' }
    default: // pending, not confirmed, provisional, not paid
      return { status: 'pending', payment: 'unpaid' }
  }
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function syncTuriTopBookings(
  providerId: string,
  opts: { force?: boolean; maxAgeMs?: number } = {}
): Promise<TuriTopSyncResult> {
  const empty: TuriTopSyncResult = { ok: true, imported: 0, updated: 0, cancelled: 0 }
  try {
    const admin = createAdminClient()

    const { data: prov } = await admin
      .from('providers')
      .select('id, turitop_has_key, turitop_last_sync_at')
      .eq('id', providerId)
      .maybeSingle()
    if (!prov) return { ...empty, ok: false, error: 'Provider not found' }

    const maxAge = opts.maxAgeMs ?? DEFAULT_MAX_AGE_MS
    if (!opts.force && prov.turitop_last_sync_at && Date.now() - new Date(prov.turitop_last_sync_at as string).getTime() < maxAge) {
      return { ...empty, skipped: true }
    }

    const key = await getTuriTopKey(providerId)
    if (!key) return { ...empty, skipped: true }

    const from = isoDay(-WINDOW_DAYS)
    const to = isoDay(WINDOW_DAYS)
    const today = isoDay(0)

    // 1. Everything TuriTop has in the window
    const all = await getTuriTopBookings(key, from, to, 40)

    // 2. Skip bookings that Exploria itself pushed into TuriTop (already a reservation)
    const { data: mirrored } = await admin
      .from('reservations')
      .select('turitop_booking_id')
      .eq('provider_id', providerId)
      .not('turitop_booking_id', 'is', null)
    const mirroredIds = new Set((mirrored ?? []).map((r) => r.turitop_booking_id as string))
    const incoming = all.filter((b) => !mirroredIds.has(b.id))

    // 3. What is already imported
    const { data: existingRows } = await admin
      .from('reservations')
      .select('id, external_id, status, participants, total_price, activity_date, activity_time, payment_status')
      .eq('provider_id', providerId)
      .eq('external_source', 'turitop')
      .limit(10000)
    const existing = new Map((existingRows ?? []).map((r) => [r.external_id as string, r]))

    // 4. Product → activity map (create hidden placeholders when missing)
    const { data: acts } = await admin
      .from('activities')
      .select('id, turitop_product_id')
      .eq('provider_id', providerId)
      .not('turitop_product_id', 'is', null)
    const activityByProduct = new Map<string, string>()
    for (const a of acts ?? []) if (!activityByProduct.has(a.turitop_product_id as string)) activityByProduct.set(a.turitop_product_id as string, a.id as string)

    const ensureActivity = async (productId: string, productName: string): Promise<string | null> => {
      const found = activityByProduct.get(productId)
      if (found) return found
      let d: Awaited<ReturnType<typeof getTuriTopImportData>> | null = null
      try { d = await getTuriTopImportData(key, productId) } catch { /* product removed in TuriTop */ }
      const title = d?.title ?? productName
      const { data: created, error } = await admin
        .from('activities')
        .insert({
          provider_id: providerId,
          title,
          slug: `${slugify(title) || 'turitop'}-${productId.toLowerCase()}-${Date.now().toString(36)}`,
          description: d?.description || title,
          short_description: d?.summary || null,
          price_from: d?.priceFrom ?? 0,
          duration_minutes: d?.durationMinutes ?? 60,
          max_participants: d?.maxParticipants ?? 10,
          min_participants: 1,
          languages: ['es'],
          meeting_point: d?.city ?? 'Torrevieja',
          city: d?.city ?? 'Torrevieja',
          country: 'ES',
          latitude: d?.latitude ?? null,
          longitude: d?.longitude ?? null,
          external_booking_platform: 'turitop',
          turitop_service_code: productId,
          turitop_product_id: productId,
          status: 'archived',
          turitop_placeholder: true,
        })
        .select('id')
        .single()
      if (error || !created) return null
      activityByProduct.set(productId, created.id as string)
      return created.id as string
    }

    let imported = 0
    let updated = 0
    const seen = new Set<string>()
    const toInsert: Record<string, unknown>[] = []

    for (const b of incoming) {
      seen.add(b.id)
      const { status, payment } = mapStatus(b, today)
      const row = existing.get(b.id)

      if (row) {
        const changed =
          row.status !== status ||
          row.payment_status !== payment ||
          row.participants !== Math.max(1, b.participants) ||
          Number(row.total_price) !== b.total ||
          row.activity_date !== b.date ||
          String(row.activity_time).slice(0, 5) !== b.time
        if (changed) {
          await admin
            .from('reservations')
            .update({
              status,
              payment_status: payment,
              participants: Math.max(1, b.participants),
              total_price: b.total,
              activity_date: b.date,
              activity_time: b.time || '00:00',
            })
            .eq('id', row.id as string)
          updated++
        }
        continue
      }

      const activityId = await ensureActivity(b.productId, b.productName)
      if (!activityId) continue
      toInsert.push({
        activity_id: activityId,
        provider_id: providerId,
        customer_id: null,
        booking_date: b.bookedOn || b.date,
        activity_date: b.date,
        activity_time: b.time || '00:00',
        participants: Math.max(1, b.participants),
        total_price: b.total,
        status,
        payment_status: payment,
        source: 'turitop',
        confirmation_code: b.id,
        external_source: 'turitop',
        external_id: b.id,
        external_channel: b.source || null,
        external_customer_name: b.customerName || null,
        external_customer_email: b.customerEmail || null,
        external_customer_phone: b.customerPhone || null,
        notes: null,
      })
    }

    for (let i = 0; i < toInsert.length; i += 100) {
      const chunk = toInsert.slice(i, i + 100)
      const { error } = await admin.from('reservations').insert(chunk)
      if (error) {
        // Fall back to one-by-one so a single bad row does not block the rest.
        for (const r of chunk) {
          const { error: e2 } = await admin.from('reservations').insert(r)
          if (!e2) imported++
          else console.error('TuriTop import row failed:', r.external_id, e2.message)
        }
      } else {
        imported += chunk.length
      }
    }

    // 5. Bookings deleted in TuriTop no longer come back → cancel them here.
    let cancelled = 0
    for (const [extId, row] of existing) {
      if (seen.has(extId) || row.status === 'cancelled') continue
      const d = row.activity_date as string
      if (d < from || d > to) continue
      await admin.from('reservations').update({ status: 'cancelled' }).eq('id', row.id as string)
      cancelled++
    }

    await admin.from('providers').update({ turitop_last_sync_at: new Date().toISOString() }).eq('id', providerId)
    return { ok: true, imported, updated, cancelled }
  } catch (err) {
    console.error('TuriTop sync failed for provider', providerId, err)
    return { ...empty, ok: false, error: (err as Error).message }
  }
}

/** Syncs every provider that connected TuriTop (used by cron and the admin views). */
export async function syncAllTuriTopProviders(opts: { force?: boolean; maxAgeMs?: number } = {}): Promise<TuriTopSyncResult> {
  const admin = createAdminClient()
  const { data: providers } = await admin.from('providers').select('id').eq('turitop_has_key', true)
  const total: TuriTopSyncResult = { ok: true, imported: 0, updated: 0, cancelled: 0 }
  const results = await Promise.all((providers ?? []).map((p) => syncTuriTopBookings(p.id as string, opts)))
  for (const r of results) {
    total.imported += r.imported
    total.updated += r.updated
    total.cancelled += r.cancelled
    if (!r.ok) { total.ok = false; total.error = r.error }
  }
  return total
}
