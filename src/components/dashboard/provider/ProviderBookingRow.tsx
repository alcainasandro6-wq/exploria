'use client'

import { useState } from 'react'
import { Calendar, Clock, Users, Loader2, Phone, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate, getInitials } from '@/lib/utils'
import { confirmReservationAction, rejectReservationAction, completeReservationAction, markNoShowAction } from '@/app/actions/reservations'
import { toast } from 'sonner'
import type { Reservation, ReservationStatus } from '@/types/database'

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success', pending: 'warning', completed: 'secondary',
  cancelled: 'destructive', rejected: 'destructive', no_show: 'destructive',
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendiente', completed: 'Completado',
  cancelled: 'Cancelado', rejected: 'Rechazado', no_show: 'No presentado',
}

export function ProviderBookingRow({ booking }: { booking: Reservation }) {
  const [status, setStatus] = useState<ReservationStatus>(booking.status)
  const [loading, setLoading] = useState<string | null>(null)

  const run = async (action: string, fn: () => Promise<{ success: boolean; error?: string }>, nextStatus: ReservationStatus) => {
    setLoading(action)
    const res = await fn()
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setStatus(nextStatus)
    toast.success('Reserva actualizada')
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
          {getInitials(booking.customer?.full_name || 'Cliente')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{booking.customer?.full_name || 'Cliente'}</p>
          <p className="text-sm text-slate-600 truncate">{booking.activity?.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(booking.activity_date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.activity_time}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.participants}</span>
            {booking.customer?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.customer.phone}</span>}
            {booking.customer?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.customer.email}</span>}
          </div>
          {booking.notes && <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{booking.notes}&rdquo;</p>}
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
          <span className="text-sm font-bold text-slate-900">{formatPrice(booking.total_price)}</span>
          {status === 'pending' && (
            <div className="flex gap-1.5">
              <Button size="sm" className="text-xs h-7" disabled={loading !== null} onClick={() => run('confirm', () => confirmReservationAction(booking.id), 'confirmed')}>
                {loading === 'confirm' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" disabled={loading !== null} onClick={() => {
                const reason = window.prompt('Motivo del rechazo:') ?? ''
                if (reason.trim()) run('reject', () => rejectReservationAction(booking.id, reason.trim()), 'rejected')
              }}>
                {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Rechazar'}
              </Button>
            </div>
          )}
          {status === 'confirmed' && (
            <div className="flex gap-1.5">
              <Button size="sm" className="text-xs h-7" disabled={loading !== null} onClick={() => run('complete', () => completeReservationAction(booking.id), 'completed')}>
                {loading === 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Completada'}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" disabled={loading !== null} onClick={() => run('noshow', () => markNoShowAction(booking.id), 'no_show')}>
                {loading === 'noshow' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'No presentado'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
