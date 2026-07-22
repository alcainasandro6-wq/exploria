import { NextRequest, NextResponse } from 'next/server'
import { getPublishedActivities, type ActivitySearchFilters } from '@/lib/services/activities'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const filters: ActivitySearchFilters = {
    q: searchParams.get('q') ?? undefined,
    categorySlug: searchParams.get('category') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    sort: (searchParams.get('sort') as ActivitySearchFilters['sort']) ?? undefined,
  }

  const activities = await getPublishedActivities(filters)
  return NextResponse.json({ activities })
}
