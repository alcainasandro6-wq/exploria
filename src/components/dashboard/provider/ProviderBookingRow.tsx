'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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

export function ProviderBookingRow({ booking }: { booking: Reservation }) {
  const t = useTranslations('provider_booking_row')
  const STATUS_LABELS: Record<string, string> = {
    confirmed: t('status_confirmed'), pending: t('status_pending'), completed: t('status_completed'),
    cancelled: t('status_cancelled'), rejected: t('status_rejected'), no_show: t('status_no_show'),
  }
  const external = !!booking.external_source
  const customerName = booking.customer?.full_name || booking.external_customer_name || t('default_customer_name')
  const [status, setStatus] = useState<ReservationStatus>(booking.status)
  const [loading, setLoading] = useState<string | null>(null)

  const run = async (action: string, fn: () => Promise<{ success: boolean; error?: string }>, nextStatus: ReservationStatus) => {
    setLoading(action)
    const res = await fn()
    setLoading(null)
    if (!res.success) { toast.error(res.error); return }
    setStatus(nextStatus)
    toast.success(t('updated_toast'))
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
          {getInitials(customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 flex items-center gap-2">{customerName}{external && <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 text-[10px] font-semibold">TuriTop{booking.external_channel ? ` · ${booking.external_channel}` : ''}</span>}</p>
          <p className="text-sm text-slate-600 truncate">{booking.activity?.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(booking.activity_date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.activity_time}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.participants}</span>
            {(booking.customer?.phone || booking.external_customer_phone) && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.customer?.phone || booking.external_customer_phone}</span>}
            {(booking.customer?.email || booking.external_customer_email) && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.customer?.email || booking.external_customer_email}</span>}
          </div>
          {booking.notes && <p className="text-xs text-slate-400 mt-1 italic">&ldquo;{booking.notes}&rdquo;</p>}
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <Badge variant={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>
          <span className="text-sm font-bold text-slate-900">{formatPrice(booking.total_price)}</span>
          {!external && status === 'pending' && (
            <div className="flex gap-1.5">
              <Button size="sm" className="text-xs h-7" disabled={loading !== null} onClick={() => run('confirm', () => confirmReservationAction(booking.id), 'confirmed')}>
                {loading === 'confirm' ? <Loader2 className="w-3 h-3 animate-spin" /> : t('confirm_button')}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" disabled={loading !== null} onClick={() => {
                const reason = window.prompt(t('reject_prompt')) ?? ''
                if (reason.trim()) run('reject', () => rejectReservationAction(booking.id, reason.trim()), 'rejected')
              }}>
                {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : t('reject_button')}
              </Button>
            </div>
          )}
          {!external && status === 'confirmed' && (
            <div className="flex gap-1.5">
              <Button size="sm" className="text-xs h-7" disabled={loading !== null} onClick={() => run('complete', () => completeReservationAction(booking.id), 'completed')}>
                {loading === 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : t('complete_button')}
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7" disabled={loading !== null} onClick={() => run('noshow', () => markNoShowAction(booking.id), 'no_show')}>
                {loading === 'noshow' ? <Loader2 className="w-3 h-3 animate-spin" /> : t('no_show_button')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
