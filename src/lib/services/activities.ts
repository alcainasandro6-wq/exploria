import { createClient } from '@/lib/supabase/server'
import type { Activity, ActivityImage, Category, Review } from '@/types/database'

export interface ActivitySearchFilters {
  q?: string
  categorySlug?: string
  city?: string
  maxPrice?: number
  sort?: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'popular'
}

export interface ActivityListItem extends Activity {
  images: ActivityImage[]
  category: Category | null
}

// Public listing/search: only ever returns published activities.
export async function getPublishedActivities(filters: ActivitySearchFilters = {}): Promise<ActivityListItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('activities')
    .select('*, images:activity_images(*), category:categories(*), provider:providers(id, company_name, slug, is_verified)')
    .eq('status', 'published')

  if (filters.city) query = query.ilike('city', filters.city)
  if (filters.maxPrice) query = query.lte('price_from', filters.maxPrice)
  if (filters.q?.trim()) {
    const q = filters.q.trim()
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,short_description.ilike.%${q}%`)
  }
  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.categorySlug)
      .single()
    if (category) query = query.eq('category_id', category.id)
    else return []
  }

  switch (filters.sort) {
    case 'rating': query = query.order('rating', { ascending: false }); break
    case 'price_asc': query = query.order('price_from', { ascending: true }); break
    case 'price_desc': query = query.order('price_from', { ascending: false }); break
    case 'popular': query = query.order('booking_count', { ascending: false }); break
    default: query = query.order('featured', { ascending: false }).order('rating', { ascending: false })
  }

  const { data, error } = await query.limit(60)
  if (error || !data) return []
  return data as unknown as ActivityListItem[]
}

export interface ReviewWithAuthor extends Review {
  author_name: string | null
  author_avatar: string | null
}

export interface ActivityDetail extends Activity {
  images: ActivityImage[]
  category: Category | null
  provider: NonNullable<Activity['provider']>
}

// Public product page: only ever returns published activities.
export async function getActivityBySlug(slug: string): Promise<ActivityDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      images:activity_images(*),
      category:categories(*),
      provider:providers(id, company_name, slug, description, address, city, country, phone, logo_url, website, is_verified)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as unknown as ActivityDetail
}

export async function getActivityReviews(activityId: string): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('activity_id', activityId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !reviews || reviews.length === 0) return []

  const authorIds = [...new Set(reviews.map((r) => r.customer_id))]
  const { data: authors } = await supabase
    .from('public_review_authors')
    .select('id, full_name, avatar_url')
    .in('id', authorIds)

  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]))

  return reviews.map((r) => ({
    ...r,
    author_name: authorMap.get(r.customer_id)?.full_name ?? null,
    author_avatar: authorMap.get(r.customer_id)?.avatar_url ?? null,
  }))
}
