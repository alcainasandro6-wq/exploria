'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Globe, Gift } from 'lucide-react'
import { adminUpdateProviderApplicationAction } from '@/app/actions/admin'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { ProviderApplication, ProviderApplicationStatus } from '@/types/database'

const STATUS_VARIANT: Record<ProviderApplicationStatus, 'warning' | 'secondary' | 'success' | 'destructive'> = {
  new: 'warning',
  contacted: 'secondary',
  approved: 'success',
  rejected: 'destructive',
}

export function ProviderApplicationRow({ application }: { application: ProviderApplication }) {
  const t = useTranslations('admin_provider_application_row')
  const [status, setStatus] = useState(application.status)
  const [saving, setSaving] = useState(false)

  const STATUS_LABELS: Record<ProviderApplicationStatus, string> = {
    new: t('status_new'), contacted: t('status_contacted'),
    approved: t('status_approved'), rejected: t('status_rejected'),
  }

  const handleStatusChange = async (newStatus: ProviderApplicationStatus) => {
    setSaving(true)
    const res = await adminUpdateProviderApplicationAction(application.id, { status: newStatus })
    setSaving(false)
    if (!res.success) { toast.error(res.error); return }
    setStatus(newStatus)
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{application.company_name}</p>
            <p className="text-sm text-slate-500">{application.contact_name}</p>
          </div>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ProviderApplicationStatus)}
            disabled={saving}
            className="shrink-0"
          >
            {(Object.keys(STATUS_LABELS) as ProviderApplicationStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500 mt-3">
          <a href={`mailto:${application.email}`} className="flex items-center gap-1.5 hover:text-primary">
            <Mail className="w-3.5 h-3.5" />{application.email}
          </a>
          {application.phone && (
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{application.phone}</span>
          )}
          {application.website && (
            <a href={application.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
              <Globe className="w-3.5 h-3.5" />{t('website_link')}
            </a>
          )}
          {application.referral_code && (
            <span className="flex items-center gap-1.5 text-primary"><Gift className="w-3.5 h-3.5" />{application.referral_code}</span>
          )}
        </div>

        {application.activities_description && (
          <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-xl p-3">{application.activities_description}</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
          <span className="text-xs text-slate-400">{formatDate(application.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
