'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Users, Shield, LogIn, Clock, CheckCircle2, Loader2, Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import { getAttributionFromCookie } from '@/lib/services/attribution'
import { BookingCalendar } from '@/components/booking/BookingCalendar'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import type { Activity } from '@/types/database'

interface BookingWidgetProps {
  activity: Activity
}

function formatSelectedDate(isoDate: string, locale: string): string {
  const raw = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(isoDate + 'T00:00:00'))
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function BookingWidget({ activity }: BookingWidgetProps) {
  const t = useTranslations('activity')
  const locale = useLocale()
  const router = useRouter()
  const [participants, setParticipants] = useState(Math.max(activity.min_participants, 1))
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ confirmation_code: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [supabase])


  const handleBook = async () => {
    if (!isLoggedIn) {
      const currentPath = window.location.pathname
      router.push(`/auth/login?redirectTo=${encodeURIComponent(currentPath)}`)
      return
    }
    if (!selectedDate || !selectedTime) return

    setSubmitting(true)
    setError(null)

    const attribution = getAttributionFromCookie()

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activity.id,
          activity_date: selectedDate,
          activity_time: selectedTime,
          participants,
          notes: notes.trim() || undefined,
          hotel_code: attribution?.affiliateCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo completar la solicitud de reserva')
        return
      }
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl)
        return
      }
      // Checkout session creation failed server-side but the reservation
      // exists — let the customer retry payment from their bookings list.
      setSuccess({ confirmation_code: data.reservation.confirmation_code })
    } catch {
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-1">¡Solicitud enviada!</h3>
        <p className="text-sm text-slate-500 mb-4">
          El proveedor confirmará tu reserva en breve. Código de confirmación:
        </p>
        <code className="inline-block bg-slate-50 rounded-xl px-4 py-2 font-mono font-bold text-primary">
          {success.confirmation_code}
        </code>
        <p className="text-xs text-slate-400 mt-4">Podrás ver el estado en tu panel de reservas.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Price Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm opacity-80">Desde</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold">{formatPrice(activity.price_from)}</span>
          <span className="text-sm opacity-80">/ persona</span>
        </div>
        {activity.review_count > 0 && (
          <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
            <span>⭐</span>
            <span className="font-semibold">{activity.rating}</span>
            <span>({activity.review_count} reseñas)</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Date */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            <Calendar className="w-4 h-4 inline mr-1.5" />
            {t('select_date')}
          </label>
          <button
            type="button"
            onClick={() => setCalendarOpen((v) => !v)}
            className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-left hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className={selectedDate ? 'text-slate-900 font-medium' : 'text-slate-400'}>
              {selectedDate ? formatSelectedDate(selectedDate, locale) : t('select_date')}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${calendarOpen ? 'rotate-180' : ''}`} />
          </button>
          {calendarOpen && (
            <div className="mt-2">
              <BookingCalendar
                value={selectedDate}
                onChange={(date) => { setSelectedDate(date); setCalendarOpen(false) }}
              />
            </div>
          )}
        </div>

        {/* Time */}
        {selectedDate && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              <Clock className="w-4 h-4 inline mr-1.5" />
              Hora
            </label>
            <TimeSlotPicker value={selectedTime} onChange={setSelectedTime} />
          </div>
        )}

        {/* Participants */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            <Users className="w-4 h-4 inline mr-1.5" />
            {t('select_participants')}
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setParticipants(Math.max(activity.min_participants, participants - 1))}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center text-sm font-semibold py-2.5">
              {participants} {participants === 1 ? 'persona' : 'personas'}
            </div>
            <button
              onClick={() => setParticipants(Math.min(activity.max_participants, participants + 1))}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mín. {activity.min_participants} — Máx. {activity.max_participants} personas
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        {/* Book Button */}
        {isLoggedIn === false ? (
          <div className="space-y-3">
            <Button onClick={handleBook} className="w-full" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              Inicia sesión para reservar
            </Button>
            <p className="text-xs text-center text-slate-400">
              Crea una cuenta gratis o inicia sesión para solicitar tu reserva.
            </p>
          </div>
        ) : (
          <Button onClick={handleBook} className="w-full" size="lg" disabled={!selectedDate || !selectedTime || submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {t('book_button')}
          </Button>
        )}

        {/* Legal Notice — compact */}
        <p className="text-xs text-center text-slate-400">
          <Shield className="w-3 h-3 inline mr-1" />
          Pago seguro · {t('legal_notice')}
        </p>
      </div>
    </div>
  )
}
