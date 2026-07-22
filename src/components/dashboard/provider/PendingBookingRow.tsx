'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import { confirmReservationAction, rejectReservationAction } from '@/app/actions/reservations'
import { toast } from 'sonner'
import type { Reservation } from '@/types/database'

export function PendingBookingRow({ booking }: { booking: Reservation }) {
  const [status, setStatus] = useState(booking.status)
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)

  const handleConfirm = async () => {
    setLoading('confirm')
    const res = await confirmReservationAction(booking.id)
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setStatus('confirmed')
    toast.success('Reserva confirmada')
  }

  const handleReject = async () => {
    const reason = window.prompt('Motivo del rechazo (se enviará al cliente):') ?? ''
    if (!reason.trim()) return
    setLoading('reject')
    const res = await rejectReservationAction(booking.id, reason.trim())
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setStatus('rejected')
    toast.success('Reserva rechazada')
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
        <span className="text-purple-600 font-bold text-sm">{getInitials(booking.customer?.full_name || 'Cliente')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{booking.customer?.full_name || 'Cliente'}</p>
        <p className="text-xs text-slate-500 truncate">{booking.activity?.title} · {booking.participants} pers. · {formatDate(booking.activity_date)}</p>
      </div>
      {status === 'pending' ? (
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" className="text-xs h-7 px-2.5" onClick={handleConfirm} disabled={loading !== null}>
            {loading === 'confirm' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5" onClick={handleReject} disabled={loading !== null}>
            {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Rechazar'}
          </Button>
        </div>
      ) : (
        <Badge variant={status === 'confirmed' ? 'success' : 'destructive'}>{status === 'confirmed' ? 'Confirmado' : 'Rechazado'}</Badge>
      )}
    </div>
  )
}
