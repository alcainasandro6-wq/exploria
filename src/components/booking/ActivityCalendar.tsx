'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Loader2, Users, Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarAvailability, CalendarEvent, CalendarEventStatus } from '@/lib/calendar-types'

type View = 'week' | 'month' | 'year'

interface ActivityCalendarProps {
  events: CalendarEvent[]
  /** Day availability from the provider's TuriTop connection (optional). */
  availability?: CalendarAvailability[]
  /** Called whenever the visible range changes, so the parent can fetch that range. */
  onRangeChange?: (from: string, to: string) => void
  loading?: boolean
  /** Shown as a warning banner (e.g. TuriTop unreachable). */
  warning?: string | null
  className?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const startOfWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)) // Monday-first
  return x
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

const STATUS_DOT: Record<CalendarEventStatus, string> = {
  confirmed: 'bg-emerald-500',
  pending: 'bg-amber-500',
  completed: 'bg-slate-400',
  cancelled: 'bg-red-400',
  rejected: 'bg-red-400',
  no_show: 'bg-red-400',
}
const STATUS_CHIP: Record<CalendarEventStatus, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
  no_show: 'bg-red-50 text-red-600 border-red-100',
}

export function ActivityCalendar({ events, availability = [], onRangeChange, loading, warning, className }: ActivityCalendarProps) {
  const t = useTranslations('activity_calendar')
  const locale = useLocale()
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState<Date>(today)
  const [selected, setSelected] = useState<string>(toISO(today))

  const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat(locale, opts).format(d)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1) // a Monday
    return Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(addDays(base, i)).replace('.', ''))
  }, [locale])

  // Visible range per view, used both for rendering and for parent fetching.
  const range = useMemo(() => {
    if (view === 'week') {
      const s = startOfWeek(cursor)
      return { from: s, to: addDays(s, 6) }
    }
    if (view === 'month') {
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
      return { from: startOfWeek(first), to: addDays(startOfWeek(last), 6) }
    }
    return { from: new Date(cursor.getFullYear(), 0, 1), to: new Date(cursor.getFullYear(), 11, 31) }
  }, [view, cursor])

  const fromISO = toISO(range.from)
  const toISOStr = toISO(range.to)
  useEffect(() => { onRangeChange?.(fromISO, toISOStr) }, [fromISO, toISOStr, onRangeChange])

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const arr = m.get(e.date) ?? []
      arr.push(e)
      m.set(e.date, arr)
    }
    for (const arr of m.values()) arr.sort((a, b) => a.time.localeCompare(b.time))
    return m
  }, [events])

  const availByDay = useMemo(() => {
    const m = new Map<string, CalendarAvailability[]>()
    for (const a of availability) {
      const arr = m.get(a.date) ?? []
      arr.push(a)
      m.set(a.date, arr)
    }
    return m
  }, [availability])

  const step = (dir: -1 | 1) => {
    setCursor((c) => {
      if (view === 'week') return addDays(c, 7 * dir)
      if (view === 'month') return new Date(c.getFullYear(), c.getMonth() + dir, 1)
      return new Date(c.getFullYear() + dir, c.getMonth(), 1)
    })
  }

  const title =
    view === 'week'
      ? `${fmt({ day: 'numeric', month: 'short' }, range.from)} – ${fmt({ day: 'numeric', month: 'short', year: 'numeric' }, range.to)}`
      : view === 'month'
        ? cap(fmt({ month: 'long', year: 'numeric' }, cursor))
        : String(cursor.getFullYear())

  const availSummary = (iso: string) => {
    const list = availByDay.get(iso)
    if (!list || list.length === 0) return null
    const open = list.filter((a) => a.available)
    if (open.length === 0) return { label: t('sold_out'), tone: 'bg-red-50 text-red-600' }
    const places = open.reduce((s, a) => s + (a.vacancies ?? 0), 0)
    return {
      label: places > 0 ? t('spots_left', { count: places }) : t('available'),
      tone: 'bg-emerald-50 text-emerald-700',
    }
  }

  const selectedEvents = eventsByDay.get(selected) ?? []
  const selectedAvail = availByDay.get(selected) ?? []
  const selectedDate = new Date(selected + 'T00:00:00')

  const renderDay = (day: Date, compact?: boolean) => {
    const iso = toISO(day)
    const list = eventsByDay.get(iso) ?? []
    const avail = availSummary(iso)
    const isToday = iso === toISO(today)
    const isSel = iso === selected
    const outside = view === 'month' && day.getMonth() !== cursor.getMonth()
    return (
      <button
        key={iso}
        type="button"
        onClick={() => setSelected(iso)}
        className={cn(
          'text-left rounded-xl border p-1.5 sm:p-2 transition-colors flex flex-col gap-1 min-w-0',
          compact ? 'min-h-[64px] sm:min-h-[96px]' : 'min-h-[96px]',
          isSel ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-300',
          outside && 'opacity-40'
        )}
      >
        <span className={cn('text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full', isToday ? 'bg-primary text-white' : 'text-slate-700')}>
          {day.getDate()}
        </span>
        {/* Desktop: event chips. Mobile: dots only, detail is in the day panel below. */}
        <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
          {list.slice(0, 2).map((e) => (
            <span key={e.id} className={cn('truncate rounded-md border px-1 py-0.5 text-[10px] font-medium', STATUS_CHIP[e.status])}>
              {e.time && `${e.time} `}{e.title}
            </span>
          ))}
          {list.length > 2 && <span className="text-[10px] text-slate-400 px-1">{t('more', { count: list.length - 2 })}</span>}
        </div>
        <div className="flex sm:hidden flex-wrap gap-0.5">
          {list.slice(0, 4).map((e) => <span key={e.id} className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[e.status])} />)}
        </div>
        {avail && (
          <span className={cn('mt-auto truncate rounded-md px-1 py-0.5 text-[9px] sm:text-[10px] font-semibold', avail.tone)}>{avail.label}</span>
        )}
      </button>
    )
  }

  const monthDays = useMemo(() => {
    if (view !== 'month') return []
    const out: Date[] = []
    for (let d = range.from; d <= range.to; d = addDays(d, 1)) out.push(d)
    return out
  }, [view, range])

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-slate-100">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => step(-1)} aria-label={t('previous')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" onClick={() => step(1)} aria-label={t('next')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          <button type="button" onClick={() => { setCursor(today); setSelected(toISO(today)) }} className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">{t('today')}</button>
        </div>
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex-1 min-w-[120px] flex items-center gap-2">
          {title}
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </h2>
        <div className="inline-flex rounded-xl bg-slate-100 p-0.5" role="tablist">
          {(['week', 'month', 'year'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              {t(`view_${v}`)}
            </button>
          ))}
        </div>
      </div>

      {warning && (
        <div className="mx-3 sm:mx-4 mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      <div className="p-3 sm:p-4">
        {view === 'month' && (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdayLabels.map((w) => <div key={w} className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1">{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((d) => renderDay(d, true))}
            </div>
          </>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => addDays(range.from, i)).map((d, i) => (
              <div key={toISO(d)} className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1 px-1 sm:text-center">
                  <span className="sm:hidden">{cap(fmt({ weekday: 'long', day: 'numeric', month: 'short' }, d))}</span>
                  <span className="hidden sm:inline">{weekdayLabels[i]}</span>
                </p>
                {renderDay(d)}
              </div>
            ))}
          </div>
        )}

        {view === 'year' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 12 }, (_, m) => {
              const first = new Date(cursor.getFullYear(), m, 1)
              const daysIn = new Date(cursor.getFullYear(), m + 1, 0).getDate()
              const offset = (first.getDay() + 6) % 7
              const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)]
              let monthCount = 0
              for (let day = 1; day <= daysIn; day++) monthCount += (eventsByDay.get(toISO(new Date(cursor.getFullYear(), m, day))) ?? []).length
              return (
                <div key={m} className="rounded-xl border border-slate-100 p-2">
                  <button
                    type="button"
                    onClick={() => { setCursor(first); setView('month') }}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-primary mb-1.5"
                  >
                    <span>{cap(fmt({ month: 'long' }, first))}</span>
                    {monthCount > 0 && <span className="rounded-full bg-primary/10 text-primary px-1.5 text-[10px]">{monthCount}</span>}
                  </button>
                  <div className="grid grid-cols-7 gap-px text-center">
                    {cells.map((day, i) => {
                      if (day === null) return <span key={i} />
                      const iso = toISO(new Date(cursor.getFullYear(), m, day))
                      const n = (eventsByDay.get(iso) ?? []).length
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSelected(iso); setCursor(new Date(cursor.getFullYear(), m, day)) }}
                          className={cn(
                            'text-[10px] leading-5 rounded',
                            iso === toISO(today) && 'ring-1 ring-primary',
                            iso === selected && 'bg-primary text-white',
                            iso !== selected && n === 0 && 'text-slate-500 hover:bg-slate-100',
                            iso !== selected && n > 0 && n < 3 && 'bg-primary/15 text-primary font-semibold',
                            iso !== selected && n >= 3 && 'bg-primary/40 text-white font-semibold'
                          )}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      <div className="border-t border-slate-100 p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">{cap(fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, selectedDate))}</h3>

        {selectedAvail.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedAvail.map((a) => (
              <span key={a.activityId} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', a.available ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
                {a.activityTitle}: {a.available ? (a.vacancies != null ? t('spots_left', { count: a.vacancies }) : t('available')) : t('sold_out')}
              </span>
            ))}
          </div>
        )}

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-slate-400">{t('no_events')}</p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[e.status])} />
                <span className="flex items-center gap-1 text-xs font-bold text-primary w-14 shrink-0"><Clock className="w-3 h-3" />{e.time || '—'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{e.title}</p>
                  {e.subtitle && <p className="text-xs text-slate-500 truncate">{e.subtitle}</p>}
                </div>
                {e.participants != null && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 shrink-0"><Users className="w-3 h-3" />{e.participants}</span>
                )}
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0', STATUS_CHIP[e.status])}>{t(`status_${e.status}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
