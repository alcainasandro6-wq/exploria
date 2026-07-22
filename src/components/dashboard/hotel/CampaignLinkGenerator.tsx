'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import { generateCampaignLinkAction } from '@/app/actions/hotels'
import { CopyableCode } from '@/components/dashboard/hotel/CopyableCode'
import { toast } from 'sonner'

export function CampaignLinkGenerator() {
  const [generating, setGenerating] = useState(false)
  const [newLink, setNewLink] = useState<{ url: string; code: string } | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    const res = await generateCampaignLinkAction()
    setGenerating(false)
    if (!res.success || !res.url || !res.code) { toast.error(res.error ?? 'Error al generar el enlace'); return }
    setNewLink({ url: res.url, code: res.code })
    toast.success('Enlace de campaña generado')
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleGenerate} disabled={generating} variant="outline" className="gap-1.5">
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Generar nuevo enlace
      </Button>
      {newLink && <CopyableCode value={newLink.url} truncate />}
    </div>
  )
}
