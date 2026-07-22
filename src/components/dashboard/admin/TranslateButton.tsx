'use client'

import { useState } from 'react'
import { Languages, Loader2, Check } from 'lucide-react'
import { translateActivityAction } from '@/app/actions/admin'
import { toast } from 'sonner'

export function TranslateButton({ activityId }: { activityId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleTranslate = async () => {
    setLoading(true)
    const res = await translateActivityAction(activityId)
    setLoading(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('Traducciones generadas con DeepL')
    setDone(true)
  }

  if (done) return <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><Check className="w-3.5 h-3.5" />Traducido</span>

  return (
    <button onClick={handleTranslate} disabled={loading} className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
      Traducir
    </button>
  )
}
