'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminUpdateProviderTuriTopAction } from '@/app/actions/admin'
import { TuriTopImportCard } from '@/components/dashboard/provider/TuriTopImportCard'
import type { TuriTopConnectionStatus } from '@/types/database'

interface TuriTopProviderRowProps {
  providerId: string
  companyName: string
  hasKey: boolean
  status: TuriTopConnectionStatus
  error: string | null
}

const STATUS_META = {
  ok: { variant: 'success', icon: CheckCircle2 },
  error: { variant: 'destructive', icon: XCircle },
  unverified: { variant: 'secondary', icon: HelpCircle },
} as const

/** One provider row: connection status + paste-a-key-and-connect, no dialogs. */
export function TuriTopProviderRow({ providerId, companyName, hasKey, status: initialStatus, error: initialError }: TuriTopProviderRowProps) {
  const t = useTranslations('admin_settings_page')
  const [status, setStatus] = useState<TuriTopConnectionStatus>(initialStatus ?? 'unverified')
  const [error, setError] = useState(initialError ?? null)
  const [configured, setConfigured] = useState(!!hasKey)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const meta = STATUS_META[status]
  const Icon = meta.icon

  const save = async (key: string) => {
    setSaving(true)
    try {
      const res = await adminUpdateProviderTuriTopAction(providerId, key)
      if (!res.success) { toast.error(res.error); return }
      setStatus(res.status as TuriTopConnectionStatus)
      setError(res.connectionError ?? null)
      setConfigured(!!key.trim())
      setApiKey('')
      if (res.status === 'ok') toast.success(t('connected_toast'))
      else if (res.status === 'error') toast.error(res.connectionError || t('failed_toast'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 bg-slate-50 rounded-xl space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900 truncate">{companyName}</p>
        <Badge variant={meta.variant} className="gap-1 shrink-0">
          <Icon className="w-3.5 h-3.5" />
          {t(`turitop_status_${status}`)}
        </Badge>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={configured ? t('key_configured_placeholder') : t('key_placeholder')}
          className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => save(apiKey)} disabled={saving || !apiKey.trim()} className="gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('connect_button')}
          </Button>
          {configured && (
            <Button size="sm" variant="outline" onClick={() => save('')} disabled={saving}>{t('disconnect_button')}</Button>
          )}
        </div>
      </div>
      {status === 'error' && error && <p className="text-xs text-red-500">{error}</p>}
      {status === 'ok' && (
        <div>
          <button type="button" onClick={() => setShowImport((v) => !v)} className="text-xs font-semibold text-primary hover:underline">
            {showImport ? t('import_hide') : t('import_show')}
          </button>
          {showImport && <div className="mt-2"><TuriTopImportCard providerId={providerId} embedded /></div>}
        </div>
      )}
    </div>
  )
}
