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

interface LiveSlot { time: string; left: number; price: number }

function formatSelectedDate(isoDate: string, locale: string): string {
  const raw = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(isoDate + 'T00:00:00'))
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function BookingWidget({ activity }: BookingWidgetProps) {
  const t = useTranslations('activity')
  const tw = useTranslations('booking_widget')
  const locale = useLocale()
  const router = useRouter()
  const [participants, setParticipants] = useState(Math.max(activity.min_participants, 1))
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ confirmation_code: string } | null>(null)

  // Activities linked to a TuriTop product show that product's REAL departures.
  const isLive = !!activity.turitop_product_id
  const slotsKey = isLive && selectedDate ? selectedDate : ''
  const [slotsResult, setSlotsResult] = useState<{ key: string; slots: LiveSlot[] | null; error: boolean }>({ key: '', slots: null, error: false })
  const slotsReady = slotsResult.key === slotsKey
  const slotsLoading = !!slotsKey && !slotsReady
  const slots = slotsReady ? slotsResult.slots : null
  const slotsError = slotsReady && slotsResult.error

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [supabase])

  useEffect(() => {
    if (!slotsKey) return
    let cancelled = false
    fetch(`/api/turitop/slots?activity_id=${activity.id}&date=${slotsKey}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('slots')
        return (await r.json()) as { slots: LiveSlot[] }
      })
      .then((d) => { if (!cancelled) setSlotsResult({ key: slotsKey, slots: d.slots, error: false }) })
      .catch(() => { if (!cancelled) setSlotsResult({ key: slotsKey, slots: null, error: true }) })
    return () => { cancelled = true }
  }, [slotsKey, activity.id])

  const chosenSlot = slots?.find((s) => s.time === selectedTime)
  const maxPeople = chosenSlot ? Math.min(activity.max_participants, chosenSlot.left) : activity.max_participants

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
          hotel_code: attribution?.affiliateCode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tw('error_generic'))
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
      setError(tw('error_network'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-1">{tw('success_title')}</h3>
        <p className="text-sm text-slate-500 mb-4">{tw('success_desc')}</p>
        <code className="inline-block bg-slate-50 rounded-xl px-4 py-2 font-mono font-bold text-primary">
          {success.confirmation_code}
        </code>
        <p className="text-xs text-slate-400 mt-4">{tw('success_hint')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Price Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-sm opacity-80">{tw('from')}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold">{formatPrice(activity.price_from)}</span>
          <span className="text-sm opacity-80">{tw('per_person')}</span>
        </div>
        {activity.review_count > 0 && (
          <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
            <span>⭐</span>
            <span className="font-semibold">{activity.rating}</span>
            <span>({tw('reviews_count', { count: activity.review_count })})</span>
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
                onChange={(date) => { setSelectedDate(date); setSelectedTime(''); setCalendarOpen(false) }}
              />
            </div>
          )}
        </div>

        {/* Time */}
        {selectedDate && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              <Clock className="w-4 h-4 inline mr-1.5" />
              {tw('time')}
            </label>
            {!isLive ? (
              <TimeSlotPicker value={selectedTime} onChange={setSelectedTime} />
            ) : slotsLoading ? (
              <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{tw('loading_slots')}</p>
            ) : slotsError ? (
              <p className="text-sm text-red-600">{tw('slots_error')}</p>
            ) : slots && slots.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2">{tw('no_slots')}</p>
            ) : slots ? (
              <>
                <TimeSlotPicker value={selectedTime} onChange={(v) => { setSelectedTime(v); setParticipants((p) => Math.min(p, Math.max(1, Math.min(activity.max_participants, slots.find((s) => s.time === v)?.left ?? p)))) }} slots={slots.map((s) => s.time)} />
                {chosenSlot && <p className="text-xs text-slate-400 mt-1.5">{tw('seats_left', { count: chosenSlot.left })}</p>}
              </>
            ) : null}
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
              aria-label="-"
            >
              −
            </button>
            <div className="flex-1 text-center text-sm font-semibold py-2.5">
              {tw('people', { count: participants })}
            </div>
            <button
              onClick={() => setParticipants(Math.min(maxPeople, participants + 1))}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
              aria-label="+"
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {tw('min_max', { min: activity.min_participants, max: maxPeople })}
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
              {tw('login_to_book')}
            </Button>
            <p className="text-xs text-center text-slate-400">{tw('login_hint')}</p>
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
          {tw('secure_payment')} · {t('legal_notice')}
        </p>
      </div>
    </div>
  )
}
