'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { adminGrantSubscriptionAction, adminRevokeSubscriptionAction } from '@/app/actions/admin'
import type { SubscriptionPlanRecord } from '@/types/database'

interface GrantSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
  providerName: string
  plans: SubscriptionPlanRecord[]
  /** The provider's current active subscription, if any. */
  currentSubscriptionId?: string
  currentPlanId?: string
}

export function GrantSubscriptionDialog({
  open, onOpenChange, providerId, providerName, plans, currentSubscriptionId, currentPlanId,
}: GrantSubscriptionDialogProps) {
  const t = useTranslations('admin_grant_subscription_dialog')
  const router = useRouter()
  const [planId, setPlanId] = useState(currentPlanId ?? plans[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  const handleGrant = async () => {
    if (!planId) return
    setSaving(true)
    try {
      const res = await adminGrantSubscriptionAction(providerId, planId)
      if (!res.success) { toast.error(res.error); return }
      toast.success(t('granted_toast'))
      onOpenChange(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async () => {
    if (!currentSubscriptionId) return
    setSaving(true)
    try {
      const res = await adminRevokeSubscriptionAction(currentSubscriptionId)
      if (!res.success) { toast.error(res.error); return }
      toast.success(t('revoked_toast'))
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
            <Gift className="w-5 h-5 text-primary" />
            {t('title', { providerName })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {t('description')}
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">{t('field_plan')}</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} {p.price_monthly === 0 ? t('plan_free') : t('plan_price_monthly', { price: p.price_monthly })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          {currentSubscriptionId ? (
            <Button variant="outline" size="sm" onClick={handleRevoke} disabled={saving} className="text-red-600 hover:text-red-700">
              {t('cancel_subscription_button')}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>{t('close_button')}</Button>
            <Button size="sm" onClick={handleGrant} disabled={saving || !planId} className="gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t('grant_button')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
