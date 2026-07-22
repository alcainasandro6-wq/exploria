import type { ReservationSource } from '@/types/database'

// =====================================================
// Attribution cookie — stores hotel referral info
// =====================================================

export const ATTRIBUTION_COOKIE = 'bookactivities_ref'
export const ATTRIBUTION_MAX_AGE = 30 * 24 * 60 * 60  // 30 days

export interface Attribution {
  affiliateCode: string
  source: ReservationSource
  setAt: number    // timestamp for expiry tracking
}

// ---- Client-side helpers (run in browser) ----

export function setAttributionCookie(affiliateCode: string, source: ReservationSource = 'web'): void {
  if (typeof document === 'undefined') return
  const value = encodeURIComponent(JSON.stringify({ affiliateCode, source, setAt: Date.now() }))
  const expires = new Date(Date.now() + ATTRIBUTION_MAX_AGE * 1000).toUTCString()
  document.cookie = `${ATTRIBUTION_COOKIE}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

export function getAttributionFromCookie(): Attribution | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${ATTRIBUTION_COOKIE}=`))
  if (!match) return null
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))) as Attribution
  } catch {
    return null
  }
}

export function clearAttributionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${ATTRIBUTION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

// ---- URL param parser ----

export function parseAttributionFromUrl(url: string): Attribution | null {
  try {
    const u = new URL(url)
    const ref = u.searchParams.get('ref')
    const source = (u.searchParams.get('source') ?? 'web') as ReservationSource
    if (!ref) return null
    return { affiliateCode: ref, source, setAt: Date.now() }
  } catch {
    return null
  }
}

// ---- Tracking URL builder ----

export function buildTrackingUrl(affiliateCode: string, baseUrl = ''): string {
  return `${baseUrl}/activities?ref=${affiliateCode}&source=qr`
}
