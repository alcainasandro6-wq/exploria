'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'
import { reviewActivitySubmissionAction } from '@/app/actions/admin'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'

interface ActivityReviewRowProps {
  activity: { id: string; title: string; slug: string; provider?: { company_name: string } | null }
}

export function ActivityReviewRow({ activity }: ActivityReviewRowProps) {
  const t = useTranslations('admin_activity_review_row')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState(false)

  if (done) return null

  const handleApprove = async () => {
    setLoading('approve')
    const res = await reviewActivitySubmissionAction(activity.id, true)
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('published_toast'))
    setDone(true)
  }

  const handleReject = async () => {
    const feedback = window.prompt(t('reject_prompt')) ?? ''
    if (!feedback.trim()) return
    setLoading('reject')
    const res = await reviewActivitySubmissionAction(activity.id, false, feedback.trim())
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    toast.success(t('returned_toast'))
    setDone(true)
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 rounded-xl">
      <div className="min-w-0">
        <Link href={`/activities/${activity.slug}`} target="_blank" className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
          {activity.title}
        </Link>
        <p className="text-xs text-slate-500">{activity.provider?.company_name}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Button size="sm" className="text-xs h-7 gap-1" onClick={handleApprove} disabled={loading !== null}>
          {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {t('approve_button')}
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={handleReject} disabled={loading !== null}>
          {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          {t('reject_button')}
        </Button>
      </div>
    </div>
  )
}
