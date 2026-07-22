'use client'

import { useState } from 'react'
import { Calendar, Clock, Users, MapPin, X, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import { cancelReservationAction } from '@/app/actions/reservations'
import { toast } from 'sonner'
import type { Reservation } from '@/types/database'

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success', pending: 'warning', completed: 'secondary',
  cancelled: 'destructive', rejected: 'destructive', no_show: 'destructive',
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendiente', completed: 'Completado',
  cancelled: 'Cancelado', rejected: 'Rechazado', no_show: 'No presentado',
}

export function BookingRow({ booking }: { booking: Reservation }) {
  const [cancelling, setCancelling] = useState(false)
  const [status, setStatus] = useState(booking.status)
  const canCancel = ['pending', 'confirmed'].includes(status)

  const handleCancel = async () => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return
    setCancelling(true)
    const res = await cancelReservationAction(booking.id)
    setCancelling(false)
    if (!res.success) { toast.error(res.error); return }
    setStatus('cancelled')
    toast.success('Reserva cancelada')
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/activities/${booking.activity?.slug}`} className="font-semibold text-slate-900 hover:text-primary truncate block">
            {booking.activity?.title}
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(booking.activity_date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.activity_time}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.participants} personas</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{booking.confirmation_code}</p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
          <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
          <span className="text-sm font-bold text-slate-900">{formatPrice(booking.total_price)}</span>
          {canCancel && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
