'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Send } from 'lucide-react'
import { createBlogPostAction } from '@/app/actions/blog'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

export function CreateBlogPostForm() {
  const t = useTranslations('admin_create_blog_post_form')
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)

  const reset = () => { setTitle(''); setCategory(''); setCoverImage(''); setExcerpt(''); setContent('') }

  const handleSave = async (publishNow: boolean) => {
    if (!title.trim() || !content.trim()) { toast.error(t('fill_required_error')); return }
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
    toast.success(publishNow ? t('published_toast') : t('draft_saved_toast'))
    reset()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t('field_title')}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('field_title_placeholder')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t('field_category')}</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('field_category_placeholder')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{t('field_cover_image')}</label>
        <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{t('field_excerpt')}</label>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder={t('field_excerpt_placeholder')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{t('field_content')}</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder={t('field_content_placeholder')} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving !== null} className="gap-1.5">
          {saving === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t('save_draft_button')}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving !== null} className="gap-1.5">
          {saving === 'publish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {t('publish_button')}
        </Button>
      </div>
    </div>
  )
}
