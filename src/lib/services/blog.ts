import { createClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database'

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
