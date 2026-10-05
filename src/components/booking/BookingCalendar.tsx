'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingCalendarProps {
  value: string // "YYYY-MM-DD"
  onChange: (date: string) => void
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Compact month-grid date picker — click a day instead of a native <input type="date">,
 *  the pattern used by Click&Boat / TuriTop's own booking calendars. */
export function BookingCalendar({ value, onChange }: BookingCalendarProps) {
  const locale = useLocale()
  const ta = useTranslations('a11y')
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [viewMonth, setViewMonth] = useState(() => selected ?? today)

  const monthLabelRaw = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewMonth)
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1)
  const weekdayLabels = useMemo(() => {
    // Monday-first week, matching Click&Boat/TuriTop's convention.
    const base = new Date(2024, 0, 1) // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d).replace('.', '')
    })
  }, [locale])

  const days = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = (firstOfMonth.getDay() + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const cells: (Date | null)[] = Array(startOffset).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewMonth])

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const canGoPrev = viewMonth.getFullYear() > today.getFullYear() || viewMonth.getMonth() > today.getMonth()

  const changeMonth = (delta: number) => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  return (
    <div className="border border-slate-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label={ta('prev_month')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900">{monthLabel}</span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label={ta('next_month')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const isPast = day < today
          const isSelected = selected ? isSameDay(day, selected) : false
          const isToday = isSameDay(day, today)
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onChange(toISODate(day))}
              className={cn(
                'aspect-square rounded-lg text-sm flex items-center justify-center transition-colors',
                isPast && 'text-slate-300 cursor-not-allowed',
                !isPast && !isSelected && 'text-slate-700 hover:bg-primary/10',
                isSelected && 'bg-primary text-white font-semibold',
                !isSelected && isToday && !isPast && 'ring-1 ring-primary/40'
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
