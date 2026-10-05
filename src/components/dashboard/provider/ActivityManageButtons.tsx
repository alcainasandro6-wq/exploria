'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Archive, ArchiveRestore, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import {
  updateActivityStatusAction,
  permanentlyDeleteActivityAction,
} from '@/app/actions/providers'

interface ActivityManageButtonsProps {
  activityId: string
  status: string
}

const ICON_BTN = 'h-9 w-9 shrink-0 rounded-xl'

/** Archive / restore / delete controls for a provider's own activity. */
export function ActivityManageButtons({ activityId, status }: ActivityManageButtonsProps) {
  const t = useTranslations('provider_activities_page')
  const router = useRouter()
  const [busy, setBusy] = useState<'archive' | 'restore' | 'delete' | null>(null)
  const isArchived = status === 'archived'

  const archive = async () => {
    if (!window.confirm(t('confirm_archive'))) return
    setBusy('archive')
    const res = await updateActivityStatusAction(activityId, 'archived')
    setBusy(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('archived_ok'))
    router.refresh()
  }

  const restore = async () => {
    setBusy('restore')
    const res = await updateActivityStatusAction(activityId, 'draft')
    setBusy(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('restored_ok'))
    router.refresh()
  }

  const remove = async () => {
    if (!window.confirm(t('confirm_delete'))) return
    setBusy('delete')
    const res = await permanentlyDeleteActivityAction(activityId)
    setBusy(null)
    if (!res.success) {
      toast.error(res.code === 'has_reservations' ? t('delete_has_reservations') : res.error)
      return
    }
    toast.success(t('deleted_ok'))
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
      {isArchived ? (
        <Button variant="outline" size="icon" className={ICON_BTN} onClick={restore} disabled={busy !== null} title={t('restore_button')} aria-label={t('restore_button')}>
          {busy === 'restore' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArchiveRestore className="w-4 h-4" />}
        </Button>
      ) : (
        <Button variant="outline" size="icon" className={ICON_BTN} onClick={archive} disabled={busy !== null} title={t('archive_button')} aria-label={t('archive_button')}>
          {busy === 'archive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
        </Button>
      )}
      <Button variant="outline" size="icon" className={`${ICON_BTN} text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200`} onClick={remove} disabled={busy !== null} title={t('delete_button')} aria-label={t('delete_button')}>
        {busy === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
    </div>
  )
}
