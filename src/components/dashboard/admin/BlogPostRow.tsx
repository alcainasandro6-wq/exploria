'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { togglePublishBlogPostAction, deleteBlogPostAction } from '@/app/actions/blog'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types/database'

export function BlogPostRow({ post }: { post: BlogPost }) {
  const [isPublished, setIsPublished] = useState(post.is_published)
  const [deleted, setDeleted] = useState(false)
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)

  if (deleted) return null

  const handleToggle = async () => {
    setLoading('toggle')
    const res = await togglePublishBlogPostAction(post.id, !isPublished)
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setIsPublished(!isPublished)
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el artículo "${post.title}"?`)) return
    setLoading('delete')
    const res = await deleteBlogPostAction(post.id)
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setDeleted(true)
    toast.success('Artículo eliminado')
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50">
      <td className="py-2.5 px-4 text-sm font-medium text-slate-900 max-w-xs truncate">{post.title}</td>
      <td className="py-2.5 px-4 text-sm text-slate-600">{post.category ?? '—'}</td>
      <td className="py-2.5 px-4 text-sm text-slate-500">{formatDate(post.created_at)}</td>
      <td className="py-2.5 px-4">
        <button onClick={handleToggle} disabled={loading !== null}>
          <Badge variant={isPublished ? 'success' : 'secondary'}>{isPublished ? 'Publicado' : 'Borrador'}</Badge>
        </button>
      </td>
      <td className="py-2.5 px-4">
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading !== null} className="text-red-500 hover:bg-red-50">
          {loading === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </td>
    </tr>
  )
}
