import { createPublicClient } from '@/lib/supabase/public'
import type { Category } from '@/types/database'

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data
}
