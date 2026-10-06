'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { syncTuriTopNowAction } from '@/app/actions/providers'
import { syncAllTuriTopNowAction } from '@/app/actions/admin'

/** "Sync TuriTop now": provider → own account; admin → every connected provider. */
export function SyncTuriTopButton({ admin }: { admin?: boolean }) {
  const t = useTranslations('turitop_sync')
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    const res = admin ? await syncAllTuriTopNowAction() : await syncTuriTopNowAction()
    setBusy(false)
    if (res.error === 'NOT_CONNECTED' || res.error === 'NO_KEY' || (res.success && res.connected === 0)) { toast.error(t('not_connected_toast')); return }
    if (!res.success) { toast.error(res.error || t('error_toast'), { duration: 12000 }); return }
    if (res.fetched === 0) { toast.warning(t('nothing_fetched_toast')); return }
    const changes = res.imported + res.updated + res.cancelled
    toast.success(changes > 0 ? t('done_toast', { imported: res.imported, updated: res.updated + res.cancelled }) : t('up_to_date_toast'))
    router.refresh()
  }

  return (
    <Button variant="white" size="sm" onClick={run} disabled={busy} className="gap-1.5">
      <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
      {t('button')}
    </Button>
  )
}
