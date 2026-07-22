'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Trash2, Pencil } from 'lucide-react'
import { togglePublishBlogPostAction, deleteBlogPostAction, updateBlogPostAction } from '@/app/actions/blog'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types/database'

export function BlogPostRow({ post }: { post: BlogPost }) {
  const router = useRouter()
  const [isPublished, setIsPublished] = useState(post.is_published)
  const [deleted, setDeleted] = useState(false)
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const [title, setTitle] = useState(post.title)
  const [category, setCategory] = useState(post.category ?? '')
  const [coverImage, setCoverImage] = useState(post.cover_image ?? '')
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '')
  const [content, setContent] = useState(post.content)
  const [saving, setSaving] = useState(false)

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

  const handleSaveEdit = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Rellena al menos el título y el contenido'); return }
    setSaving(true)
    const res = await updateBlogPostAction(post.id, {
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      content: content.trim(),
      coverImage: coverImage.trim() || undefined,
      category: category.trim() || undefined,
    })
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Artículo actualizado')
    setEditOpen(false)
    router.refresh()
  }

  return (
    <>
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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} disabled={loading !== null} className="text-slate-500 hover:bg-slate-100">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading !== null} className="text-red-500 hover:bg-red-50">
              {loading === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar artículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Título *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del artículo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Categoría</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Guías, Gastronomía, Naturaleza..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Imagen de portada (URL)</label>
              <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Extracto</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Contenido *</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
