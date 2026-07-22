'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'

export function CancelSubscriptionButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm('¿Seguro que quieres cancelar tu suscripción? Seguirás teniendo acceso hasta el final del período actual.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions', { method: 'DELETE' })
      if (!res.ok) { toast.error('No se pudo cancelar la suscripción'); return }
      toast.success('Suscripción programada para cancelación al final del período')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={handleCancel} disabled={loading}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      Cancelar suscripción
    </Button>
  )
}
