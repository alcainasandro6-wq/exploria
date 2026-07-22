'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Send } from 'lucide-react'
import { createBlogPostAction } from '@/app/actions/blog'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

export function CreateBlogPostForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)

  const reset = () => { setTitle(''); setCategory(''); setCoverImage(''); setExcerpt(''); setContent('') }

  const handleSave = async (publishNow: boolean) => {
    if (!title.trim() || !content.trim()) { toast.error('Rellena al menos el título y el contenido'); return }
    setSaving(publishNow ? 'publish' : 'draft')
    const res = await createBlogPostAction({
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      content: content.trim(),
      coverImage: coverImage.trim() || undefined,
      category: category.trim() || undefined,
      publishNow,
    })
    setSaving(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(publishNow ? 'Artículo publicado' : 'Borrador guardado')
    reset()
    router.refresh()
  }

  return (
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
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Resumen breve para la tarjeta del blog" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Contenido *</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Contenido del artículo..." className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving !== null} className="gap-1.5">
          {saving === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Guardar borrador
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving !== null} className="gap-1.5">
          {saving === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Publicar
        </Button>
      </div>
    </div>
  )
}
