'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Settings2, PlugZap, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { adminUpdateProviderAction, adminUpdateProviderTuriTopAction } from '@/app/actions/admin'
import type { Provider, ProviderTier, TuriTopConnectionStatus } from '@/types/database'

interface ManageProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: Provider
}

export function ManageProviderDialog({ open, onOpenChange, provider }: ManageProviderDialogProps) {
  const t = useTranslations('admin_provider_edit_dialog')
  const router = useRouter()
  const [commissionPercent, setCommissionPercent] = useState(String((provider.commission_rate * 100).toFixed(0)))
  const [tier, setTier] = useState<ProviderTier>(provider.tier)
  const [isVerified, setIsVerified] = useState(provider.is_verified)
  const [internalNotes, setInternalNotes] = useState(provider.internal_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [turitopKey, setTuritopKey] = useState('')
  const [turitopStatus, setTuritopStatus] = useState<TuriTopConnectionStatus>(provider.turitop_connection_status ?? 'unverified')
  const [turitopError, setTuritopError] = useState(provider.turitop_connection_error)
  const [turitopSaving, setTuritopSaving] = useState(false)

  const STATUS_META: Record<TuriTopConnectionStatus, { variant: 'success' | 'destructive' | 'secondary'; icon: typeof CheckCircle2; label: string }> = {
    ok: { variant: 'success', icon: CheckCircle2, label: t('turitop_status_ok') },
    error: { variant: 'destructive', icon: XCircle, label: t('turitop_status_error') },
    unverified: { variant: 'secondary', icon: HelpCircle, label: t('turitop_status_unverified') },
  }

  const handleTuriTopSave = async () => {
    setTuritopSaving(true)
    try {
      const res = await adminUpdateProviderTuriTopAction(provider.id, turitopKey)
      if (!res.success) { toast.error(res.error); return }
      setTuritopStatus(res.status! as TuriTopConnectionStatus)
      setTuritopError(res.connectionError ?? null)
      setTuritopKey('')
      if (res.status === 'ok') toast.success(t('turitop_connected_toast'))
      else if (res.status === 'error') toast.error(res.connectionError || t('turitop_connection_failed_toast'))
    } finally {
      setTuritopSaving(false)
    }
  }

  const handleSave = async () => {
    const rate = Number(commissionPercent) / 100
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      toast.error(t('invalid_commission_error'))
      return
    }

    setSaving(true)
    try {
      const res = await adminUpdateProviderAction(provider.id, {
        commissionRate: rate,
        tier,
        internalNotes,
        isVerified,
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
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            {t('title', { providerName: provider.company_name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_commission')}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_tier')}</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as ProviderTier)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="registered">{t('tier_registered')}</option>
              <option value="verified">{t('tier_verified')}</option>
              <option value="premium">{t('tier_premium')}</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-slate-700">{t('field_is_verified')}</span>
          </label>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_internal_notes')}</label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder={t('internal_notes_placeholder')}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white resize-none"
            />
            <p className="text-xs text-slate-400">{t('internal_notes_hint')}</p>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <PlugZap className="w-4 h-4 text-primary" />
                {t('turitop_title')}
              </label>
              {(() => {
                const meta = STATUS_META[turitopStatus]
                const Icon = meta.icon
                return (
                  <Badge variant={meta.variant} className="gap-1">
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </Badge>
                )
              })()}
            </div>
            <input
              type="password"
              value={turitopKey}
              onChange={(e) => setTuritopKey(e.target.value)}
              placeholder={provider.turitop_has_key ? t('turitop_key_configured_placeholder') : t('turitop_key_placeholder')}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
            />
            {turitopStatus === 'error' && turitopError && (
              <p className="text-xs text-red-500">{turitopError}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{t('turitop_hint')}</p>
              <Button variant="outline" size="sm" onClick={handleTuriTopSave} disabled={turitopSaving || !turitopKey}>
                {turitopSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                {t('turitop_save_button')}
              </Button>
            </div>
          </div>
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
