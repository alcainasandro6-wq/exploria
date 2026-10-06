import { NextRequest, NextResponse } from 'next/server'
import { syncAllTuriTopProviders } from '@/lib/services/turitop-import'

export const maxDuration = 300

// Vercel Cron: keeps imported TuriTop bookings fresh. Vercel sends
// "Authorization: Bearer <CRON_SECRET>" when the CRON_SECRET env var is set.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await syncAllTuriTopProviders({ force: true })
  return NextResponse.json(result)
}
