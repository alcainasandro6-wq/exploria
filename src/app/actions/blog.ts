'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required')
  return { user, supabase }
}

export async function createBlogPostAction(input: {
  title: string
  excerpt?: string
  content: string
  coverImage?: string
  category?: string
  publishNow?: boolean
}) {
  try {
    const { user, supabase } = await requireAdmin()
    const slug = `${slugify(input.title)}-${Date.now().toString(36)}`

    const { error } = await supabase.from('blog_posts').insert({
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      cover_image: input.coverImage ?? null,
      category: input.category ?? null,
      author_id: user.id,
      is_published: !!input.publishNow,
      published_at: input.publishNow ? new Date().toISOString() : null,
    })
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/cms')
    revalidatePath('/blog')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateBlogPostAction(postId: string, input: {
  title: string
  excerpt?: string
  content: string
  coverImage?: string
  category?: string
}) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('blog_posts')
      .update({
        title: input.title,
        excerpt: input.excerpt ?? null,
        content: input.content,
        cover_image: input.coverImage ?? null,
        category: input.category ?? null,
      })
      .eq('id', postId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/cms')
    revalidatePath('/blog')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function togglePublishBlogPostAction(postId: string, publish: boolean) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('blog_posts')
      .update({ is_published: publish, published_at: publish ? new Date().toISOString() : null })
      .eq('id', postId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/cms')
    revalidatePath('/blog')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteBlogPostAction(postId: string) {
  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/admin/cms')
    revalidatePath('/blog')
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
