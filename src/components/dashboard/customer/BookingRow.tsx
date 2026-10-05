'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Calendar, Clock, Users, MapPin, X, Loader2, CreditCard } from 'lucide-react'
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

export function BookingRow({ booking }: { booking: Reservation }) {
  const t = useTranslations('customer_booking_row')
  const [cancelling, setCancelling] = useState(false)
  const [payingNow, setPayingNow] = useState(false)
  const [status, setStatus] = useState(booking.status)
  const canCancel = ['pending', 'confirmed'].includes(status)
  const needsPayment = status === 'pending' && booking.payment_status === 'unpaid'

  const handlePayNow = async () => {
    setPayingNow(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: booking.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || t('pay_now_error')); return }
      window.location.assign(data.checkoutUrl)
    } catch {
      toast.error(t('pay_now_error'))
    } finally {
      setPayingNow(false)
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    confirmed: t('status_confirmed'), pending: t('status_pending'), completed: t('status_completed'),
    cancelled: t('status_cancelled'), rejected: t('status_rejected'), no_show: t('status_no_show'),
  }

  const handleCancel = async () => {
    if (!confirm(t('confirm_cancel'))) return
    setCancelling(true)
    const res = await cancelReservationAction(booking.id)
    setCancelling(false)
    if (!res.success) { toast.error(res.error); return }
    setStatus('cancelled')
    toast.success(t('cancel_success'))
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
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t('participants_label', { count: booking.participants })}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">{booking.confirmation_code}</p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
          <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
          <span className="text-sm font-bold text-slate-900">{formatPrice(booking.total_price)}</span>
          {needsPayment && (
            <Button size="sm" onClick={handlePayNow} disabled={payingNow} className="gap-1.5">
              {payingNow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              {t('pay_now_button')}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
              {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              {t('cancel_button')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
