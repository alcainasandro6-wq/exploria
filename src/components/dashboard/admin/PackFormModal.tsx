'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchBox } from '@/components/dashboard/admin/SearchBox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { adminCreatePackAction, adminUpdatePackAction, adminSetPackActivitiesAction } from '@/app/actions/admin'
import type { ActivitySummary } from '@/lib/services/admin'
import type { PackWithActivities } from '@/lib/services/packs'

interface PackFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit to create a new pack; pass an existing pack to edit it. */
  pack?: PackWithActivities
  activities: ActivitySummary[]
}

export function PackFormModal({ open, onOpenChange, pack, activities }: PackFormModalProps) {
  const t = useTranslations('admin_pack_form_modal')
  const router = useRouter()
  const isEdit = !!pack
  const [form, setForm] = useState({
    title: pack?.title ?? '',
    subtitle: pack?.subtitle ?? '',
    imageUrl: pack?.image_url ?? '',
    badge: pack?.badge ?? '',
    sortOrder: String(pack?.sort_order ?? 0),
    isActive: pack?.is_active ?? true,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>(pack?.activities.map((a) => a.id) ?? [])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const filteredActivities = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return activities
    return activities.filter((a) => a.title.toLowerCase().includes(q))
  }, [activities, query])

  const toggleActivity = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error(t('fill_title_error')); return }
    setSaving(true)
    try {
      const input = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        badge: form.badge.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      let packId: string
      if (isEdit) {
        const res = await adminUpdatePackAction(pack!.id, input)
        if (!res.success) { toast.error(res.error); return }
        packId = pack!.id
      } else {
        const res = await adminCreatePackAction(input)
        if (!res.success) { toast.error(res.error); return }
        packId = res.packId!
      }

      const activitiesRes = await adminSetPackActivitiesAction(packId, selectedIds)
      if (!activitiesRes.success) { toast.error(activitiesRes.error); return }

      toast.success(isEdit ? t('updated_toast') : t('created_toast'))
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_title')}</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t('field_title_placeholder')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_subtitle')}</label>
            <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder={t('field_subtitle_placeholder')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_image_url')}</label>
            <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="/pack-example.png" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('field_badge')}</label>
              <Input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder={t('field_badge_placeholder')} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('field_sort_order')}</label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-slate-300"
            />
            {t('field_active')}
          </label>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700">{t('field_activities', { count: selectedIds.length })}</label>
            <SearchBox value={query} onChange={setQuery} placeholder={t('activities_search_placeholder')} />
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
              {filteredActivities.map((a) => (
                <label key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleActivity(a.id)}
                    className="rounded border-slate-300 shrink-0"
                  />
                  <span className="flex-1 truncate">{a.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{a.price_from}€</span>
                </label>
              ))}
              {filteredActivities.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">{t('no_activities_found')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>{t('cancel_button')}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? t('save_button') : t('create_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
