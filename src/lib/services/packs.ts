import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import type { Pack } from '@/types/database'

export interface PackActivityItem {
  id: string
  title: string
  slug: string
  price_from: number
  images: { url: string; is_cover: boolean }[]
}

export interface PackWithActivities extends Omit<Pack, 'activities'> {
  activities: PackActivityItem[]
  total_price: number
}

interface RawPackRow extends Pack {
  pack_activities: { sort_order: number; activity: PackActivityItem | null }[]
}

const PACK_SELECT = `
  *,
  pack_activities(
    sort_order,
    activity:activities(id, title, slug, price_from, images:activity_images(url, is_cover))
  )
`

function mapPack(row: RawPackRow): PackWithActivities {
  const { pack_activities, ...pack } = row
  const activities = (pack_activities ?? [])
    .filter((pa): pa is { sort_order: number; activity: PackActivityItem } => pa.activity !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((pa) => pa.activity)
  const total_price = activities.reduce((sum, a) => sum + (a.price_from ?? 0), 0)
  return { ...pack, activities, total_price }
}

// Public: active packs only, ordered for the homepage carousel, each with its
// linked activities (title/price_from/images) and a computed total price.
export async function getActivePacks(): Promise<PackWithActivities[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('packs')
    .select(PACK_SELECT)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return (data as unknown as RawPackRow[]).map(mapPack)
}

// Admin: all packs (active + inactive) for the CRUD dashboard.
export async function getAllPacksAdmin(): Promise<PackWithActivities[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('packs')
    .select(PACK_SELECT)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return (data as unknown as RawPackRow[]).map(mapPack)
}

export async function getPackBySlug(slug: string): Promise<PackWithActivities | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('packs')
    .select(PACK_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return mapPack(data as unknown as RawPackRow)
}
