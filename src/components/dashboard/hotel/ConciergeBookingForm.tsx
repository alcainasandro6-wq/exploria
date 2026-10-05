'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Search, Calendar, Clock, Users, CheckCircle2, Loader2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import {
  searchActivitiesForConciergeAction,
  createConciergeReservationAction,
  type ConciergeActivityOption,
} from '@/app/actions/hotel-bookings'

export function ConciergeBookingForm() {
  const t = useTranslations('hotel_new_booking_page')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ConciergeActivityOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<ConciergeActivityOption | null>(null)

  const [activityDate, setActivityDate] = useState('')
  const [activityTime, setActivityTime] = useState('10:00')
  const [participants, setParticipants] = useState(1)
  const [notes, setNotes] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ confirmation_code: string } | null>(null)

  useEffect(() => {
    if (selected) return
    if (query.trim().length < 2) return
    let cancelled = false
    const handle = setTimeout(async () => {
      const res = await searchActivitiesForConciergeAction(query.trim())
      if (!cancelled) {
        setResults(res.activities)
        setSearching(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query, selected])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      setSearching(false)
    } else {
      setSearching(true)
    }
  }

  const handleSelectActivity = (activity: ConciergeActivityOption) => {
    setSelected(activity)
    setParticipants(Math.max(activity.min_participants, 1))
    setResults([])
    setQuery('')
  }

  const handleSubmit = async () => {
    if (!selected) { toast.error(t('error_select_activity')); return }
    if (!activityDate || !activityTime) { toast.error(t('error_select_datetime')); return }
    if (!guestName.trim() || !guestEmail.trim()) { toast.error(t('error_guest_required')); return }

    setSubmitting(true)
    try {
      const res = await createConciergeReservationAction({
        activityId: selected.id,
        activityDate,
        activityTime,
        participants,
        notes: notes.trim() || undefined,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
      })
      if (!res.success || !res.reservation) {
        toast.error(res.error ?? t('error_generic'))
        return
      }
      setSuccess({ confirmation_code: res.reservation.confirmation_code })
      toast.success(t('success_toast'))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('success_title')}</h3>
          <p className="text-slate-500 mb-5">{t('success_desc')}</p>
          <code className="inline-block bg-slate-50 rounded-xl px-5 py-3 font-mono font-bold text-primary text-lg">
            {success.confirmation_code}
          </code>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link href="/dashboard/hotel/bookings" className="text-sm font-semibold text-primary hover:underline">
              {t('success_view_bookings')}
            </Link>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => {
                setSuccess(null)
                setSelected(null)
                setActivityDate('')
                setActivityTime('10:00')
                setParticipants(1)
                setNotes('')
                setGuestName('')
                setGuestEmail('')
                setGuestPhone('')
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t('success_new_booking')}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('step1_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3">
                {selected.cover_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.cover_image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{selected.title}</p>
                  <p className="text-xs text-slate-500">
                    {selected.provider_name} · {formatPrice(selected.price_from)} {t('per_person')}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="shrink-0 p-2 text-slate-400 hover:text-slate-600"
                  aria-label={t('clear_activity')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="pl-10"
                  />
                </div>
                {searching && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('searching')}</p>
                )}
                {results.length > 0 && (
                  <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden">
                    {results.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleSelectActivity(a)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        {a.cover_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.cover_image} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                          <p className="text-xs text-slate-500">{a.provider_name} · {formatPrice(a.price_from)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('step2_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label><Calendar className="w-4 h-4 inline mr-1.5" />{t('field_date')}</Label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label><Clock className="w-4 h-4 inline mr-1.5" />{t('field_time')}</Label>
                <input
                  type="time"
                  value={activityTime}
                  onChange={(e) => setActivityTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label><Users className="w-4 h-4 inline mr-1.5" />{t('field_participants')}</Label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden w-fit">
                <button
                  onClick={() => setParticipants((p) => Math.max(selected?.min_participants ?? 1, p - 1))}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
                >
                  −
                </button>
                <div className="w-16 text-center text-sm font-semibold py-2.5">{participants}</div>
                <button
                  onClick={() => setParticipants((p) => Math.min(selected?.max_participants ?? 99, p + 1))}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-50 text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('field_notes')}</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('field_notes_placeholder')}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('step3_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400">{t('guest_hint')}</p>
            <div className="space-y-1.5">
              <Label>{t('field_guest_name')}</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={t('field_guest_name_placeholder')} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('field_guest_email')}</Label>
                <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="guest@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('field_guest_phone')}</Label>
                <Input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+34 600 000 000" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>{t('summary_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('summary_activity')}</span>
                  <span className="font-medium text-slate-900 text-right">{selected.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t('summary_participants')}</span>
                  <span className="font-medium text-slate-900">{participants}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-slate-100 pt-3">
                  <span>{t('summary_total')}</span>
                  <span className="text-primary">{formatPrice(selected.price_from * participants)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">{t('summary_empty')}</p>
            )}
            <Button onClick={handleSubmit} className="w-full mt-2" size="lg" disabled={submitting || !selected}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('submit_button')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
