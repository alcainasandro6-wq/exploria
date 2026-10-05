'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ActivityCalendar } from '@/components/booking/ActivityCalendar'
import { getProviderCalendarAction } from '@/app/actions/providers'
import type { CalendarAvailability, CalendarEvent } from '@/lib/calendar-types'

/** Calendar of one provider: its reservations plus availability pulled from
 *  that provider's OWN TuriTop connection. Data is fetched per visible range. */
export function ProviderCalendar() {
  const t = useTranslations('activity_calendar')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [availability, setAvailability] = useState<CalendarAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true)
    const res = await getProviderCalendarAction(from, to)
    setLoading(false)
    if (!res.success) { setWarning(res.error ?? t('load_error')); return }
    setEvents(res.events)
    setAvailability(res.availability)
    setWarning(res.turitopError ? t('turitop_error') : null)
  }, [t])

  return <ActivityCalendar events={events} availability={availability} onRangeChange={load} loading={loading} warning={warning} />
}
