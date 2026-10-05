'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Loader2, Trash2, Pencil } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { adminDeleteActivityAction } from '@/app/actions/admin'
import { TranslateButton } from '@/components/dashboard/admin/TranslateButton'
import { isTranslationConfigured } from '@/lib/services/translate'
import { toast } from 'sonner'
import { formatPrice, cn } from '@/lib/utils'
import type { ActivitySummary } from '@/lib/services/admin'

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  draft: 'secondary', pending_review: 'warning', published: 'success',
  suspended: 'destructive', archived: 'secondary',
}

export function AdminActivityRow({ activity }: { activity: ActivitySummary }) {
  const t = useTranslations('admin_activity_row')
  const [deleted, setDeleted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (deleted) return null

  const STATUS_LABELS: Record<string, string> = {
    draft: t('status_draft'), pending_review: t('status_pending_review'), published: t('status_published'),
    suspended: t('status_suspended'), archived: t('status_archived'),
  }

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm', { title: activity.title }))) return
    setLoading(true)
    const res = await adminDeleteActivityAction(activity.id)
    setLoading(false)
    if (!res.success) { toast.error(res.error); return }
    setDeleted(true)
    toast.success(t('deleted_toast'))
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50">
      <td className="py-3 px-4 text-sm font-medium text-slate-900">{activity.title}</td>
      <td className="py-3 px-4 text-sm text-slate-600">{activity.provider?.company_name}</td>
      <td className="py-3 px-4 text-sm text-slate-600">{formatPrice(activity.price_from)}</td>
      <td className="py-3 px-4 text-sm text-slate-600">{activity.booking_count}</td>
      <td className="py-3 px-4"><Badge variant={STATUS_STYLES[activity.status]}>{STATUS_LABELS[activity.status]}</Badge></td>
      {isTranslationConfigured() && <td className="py-3 px-4"><TranslateButton activityId={activity.id} /></td>}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/admin/activities/${activity.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-slate-500 hover:bg-slate-100')}>
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading} className="text-red-500 hover:bg-red-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </td>
    </tr>
  )
}
