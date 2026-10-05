'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlugZap, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateTuriTopConnectionAction } from '@/app/actions/providers'
import type { Provider, TuriTopConnectionStatus } from '@/types/database'

export function TuriTopConnectionCard({ provider }: { provider: Provider }) {
  const t = useTranslations('provider_turitop_card')
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<TuriTopConnectionStatus>(provider.turitop_connection_status ?? 'unverified')
  const [error, setError] = useState(provider.turitop_connection_error)
  const [saving, setSaving] = useState(false)

  const STATUS_META: Record<TuriTopConnectionStatus, { variant: 'success' | 'destructive' | 'secondary'; icon: typeof CheckCircle2; label: string }> = {
    ok: { variant: 'success', icon: CheckCircle2, label: t('status_ok') },
    error: { variant: 'destructive', icon: XCircle, label: t('status_error') },
    unverified: { variant: 'secondary', icon: HelpCircle, label: t('status_unverified') },
  }
  const meta = STATUS_META[status]
  const StatusIcon = meta.icon

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateTuriTopConnectionAction(apiKey)
      if (!res.success) { toast.error(res.error); return }
      setStatus(res.status! as TuriTopConnectionStatus)
      setError(res.connectionError ?? null)
      setApiKey('')
      if (res.status === 'ok') toast.success(t('connected_toast'))
      else if (res.status === 'error') toast.error(res.connectionError || t('connection_failed_toast'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><PlugZap className="w-4 h-4 text-primary" />{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Badge variant={meta.variant} className="gap-1 shrink-0">
            <StatusIcon className="w-3.5 h-3.5" />
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t('field_api_key_label')}</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider.turitop_has_key ? t('field_api_key_configured_placeholder') : t('field_api_key_placeholder')}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
          />
          {status === 'error' && error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <p className="text-xs text-slate-400">{t('hint')}</p>
        <Button onClick={handleSave} disabled={saving || !apiKey} size="sm" className="gap-1.5">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t('save_button')}
        </Button>
      </CardContent>
    </Card>
  )
}
