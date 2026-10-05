'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

export function CancelSubscriptionButton() {
  const t = useTranslations('provider_cancel_subscription_button')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm(t('confirm_message'))) return
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions', { method: 'DELETE' })
      if (!res.ok) { toast.error(t('error_message')); return }
      toast.success(t('success_message'))
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={handleCancel} disabled={loading}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      {t('button_label')}
    </Button>
  )
}
