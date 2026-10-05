'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { adminUpdateIncidentAction } from '@/app/actions/admin'
import { formatDate } from '@/lib/utils'
import type { IncidentStatus } from '@/types/database'
import type { IncidentWithReservation } from '@/lib/services/admin'

interface IncidentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: IncidentWithReservation
}

export function IncidentDetailDialog({ open, onOpenChange, incident }: IncidentDetailDialogProps) {
  const t = useTranslations('admin_incident_detail_dialog')
  const tType = useTranslations('admin_incident_type')
  const router = useRouter()
  const [status, setStatus] = useState<IncidentStatus>(incident.status)
  const [resolution, setResolution] = useState(incident.resolution ?? '')
  const [refundAmount, setRefundAmount] = useState(incident.refund_amount != null ? String(incident.refund_amount) : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await adminUpdateIncidentAction(incident.id, {
        status,
        resolution,
        refundAmount: refundAmount.trim() === '' ? null : Number(refundAmount),
      })
      if (!res.success) { toast.error(res.error); return }
      toast.success(t('saved_toast'))
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
            <p className="font-semibold text-slate-900">{incident.reservation?.activity?.title ?? '—'}</p>
            <p className="text-slate-500">{t('reservation_code')}: <span className="font-mono">{incident.reservation?.confirmation_code}</span></p>
            <p className="text-slate-500">{t('customer_label')}: {incident.reservation?.customer?.full_name || incident.reservation?.customer?.email || '—'}</p>
            <p className="text-slate-500">{t('provider_label')}: {incident.reservation?.provider?.company_name ?? '—'}</p>
            <p className="text-slate-500">{t('activity_date_label')}: {incident.reservation?.activity_date ? formatDate(incident.reservation.activity_date) : '—'}</p>
            <div className="pt-1">
              <Badge variant="outline">{tType(incident.type)}</Badge>
            </div>
            <p className="text-slate-600 pt-1">{incident.description}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="open">{t('status_open')}</option>
              <option value="investigating">{t('status_investigating')}</option>
              <option value="resolved">{t('status_resolved')}</option>
              <option value="dismissed">{t('status_dismissed')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_refund_amount')}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={t('refund_amount_placeholder')}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_resolution')}</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder={t('resolution_placeholder')}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white resize-none"
            />
          </div>

          {(status === 'open' || status === 'investigating') && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{t('hold_notice')}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>{t('close_button')}</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('save_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
