'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, X, ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExportButtons } from '@/components/dashboard/admin/ExportButtons'

export interface ReservationRow {
  id: string
  code: string
  customer: string
  email: string
  activity: string
  provider: string
  hotel: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  participants: number
  amount: number
  status: string
  origin: 'exploria' | 'turitop'
  channel: string
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
type TimeFilter = 'all' | 'upcoming' | 'today' | 'past'
type OriginFilter = 'all' | 'exploria' | 'turitop'

const PAGE_SIZE = 50

const STATUS_STYLES: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  confirmed: 'success', pending: 'warning', completed: 'secondary',
  cancelled: 'destructive', rejected: 'destructive', no_show: 'destructive',
}

// "cancelled" chip groups cancelled + rejected.
const statusMatches = (status: string, f: StatusFilter) =>
  f === 'all' || status === f || (f === 'cancelled' && status === 'rejected')

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function ReservationsTable({ rows }: { rows: ReservationRow[] }) {
  const t = useTranslations('admin_reservations_page')
  const locale = useLocale()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [time, setTime] = useState<TimeFilter>('all')
  const [origin, setOrigin] = useState<OriginFilter>('all')
  const [newestFirst, setNewestFirst] = useState(true)
  const [page, setPage] = useState(1)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const STATUS_LABELS: Record<string, string> = {
    confirmed: t('status_confirmed'), pending: t('status_pending'), completed: t('status_completed'),
    cancelled: t('status_cancelled'), rejected: t('status_rejected'), no_show: t('status_no_show'),
  }

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T00:00:00'))
  const fmtMoney = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

  // Counts per status chip (respecting the other filters, so numbers match what you'd see).
  const timeOk = (r: ReservationRow) => time === 'all' || (time === 'upcoming' ? r.date > today : time === 'today' ? r.date === today : r.date < today)
  const originOk = (r: ReservationRow) => origin === 'all' || r.origin === origin
  const query = norm(q.trim())
  const searchOk = (r: ReservationRow) =>
    !query || norm([r.code, r.customer, r.email, r.activity, r.provider, r.hotel, r.channel].join(' ')).includes(query)

  const base = useMemo(() => rows.filter((r) => timeOk(r) && originOk(r) && searchOk(r)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, time, origin, query, today])
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: base.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 }
    for (const r of base) {
      if (r.status === 'pending') c.pending++
      else if (r.status === 'confirmed') c.confirmed++
      else if (r.status === 'completed') c.completed++
      else if (r.status === 'cancelled' || r.status === 'rejected') c.cancelled++
      else if (r.status === 'no_show') c.no_show++
    }
    return c
  }, [base])

  const filtered = useMemo(() => {
    const list = base.filter((r) => statusMatches(r.status, status))
    list.sort((a, b) => {
      const ka = `${a.date} ${a.time}`
      const kb = `${b.date} ${b.time}`
      return newestFirst ? kb.localeCompare(ka) : ka.localeCompare(kb)
    })
    return list
  }, [base, status, newestFirst])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1) }

  const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('filter_all') },
    { key: 'pending', label: t('filter_pending') },
    { key: 'confirmed', label: t('filter_confirmed') },
    { key: 'completed', label: t('filter_completed') },
    { key: 'cancelled', label: t('filter_cancelled') },
    { key: 'no_show', label: t('filter_no_show') },
  ]
  const TIME_OPTS: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: t('time_all') },
    { key: 'upcoming', label: t('time_upcoming') },
    { key: 'today', label: t('time_today') },
    { key: 'past', label: t('time_past') },
  ]

  const exportData = filtered.map((r) => ({
    codigo: r.code,
    cliente: r.customer,
    origen: r.origin === 'turitop' ? `TuriTop${r.channel ? ' · ' + r.channel : ''}` : 'Exploria',
    proveedor: r.provider,
    hotel: r.hotel,
    actividad: r.activity,
    fecha_actividad: r.date,
    hora: r.time,
    participantes: r.participants,
    importe: r.amount,
    estado: STATUS_LABELS[r.status] ?? r.status,
  }))

  const th = 'text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 space-y-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => reset(setQ)(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
            {q && (
              <button type="button" onClick={() => reset(setQ)('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={t('clear_search')}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select value={origin} onChange={(e) => reset(setOrigin)(e.target.value as OriginFilter)} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">{t('origin_all')}</option>
              <option value="exploria">Exploria</option>
              <option value="turitop">TuriTop</option>
            </select>
            <button
              type="button"
              onClick={() => setNewestFirst((v) => !v)}
              className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white hover:bg-slate-50 whitespace-nowrap"
              title={t('sort_toggle')}
            >
              {newestFirst ? <ArrowDownWideNarrow className="w-4 h-4" /> : <ArrowUpNarrowWide className="w-4 h-4" />}
              {newestFirst ? t('sort_newest') : t('sort_oldest')}
            </button>
            <ExportButtons data={exportData} filename="reservas" title="Reservas — BookActivities" variant="outline" />
          </div>
        </div>

        {/* Time segment */}
        <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-0.5">
          {TIME_OPTS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => reset(setTime)(o.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', time === o.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => reset(setStatus)(c.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                status === c.key ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
              )}
            >
              {c.label}
              <span className={cn('rounded-full px-1.5 text-[10px]', status === c.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500')}>{counts[c.key]}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400">{t('results_count', { count: filtered.length })}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className={th}>{t('column_code')}</th>
              <th className={th}>{t('column_customer')}</th>
              <th className={th}>{t('column_activity')}</th>
              <th className={th}>{t('column_provider')}</th>
              <th className={th}>{t('column_date')}</th>
              <th className={th}>{t('column_amount')}</th>
              <th className={th}>{t('column_status')}</th>
              <th className={th}>{t('column_origin')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-3 px-4 text-xs font-mono text-slate-700 whitespace-nowrap">{r.code}</td>
                <td className="py-3 px-4 text-sm text-slate-900">{r.customer || '—'}</td>
                <td className="py-3 px-4 text-sm text-slate-600 max-w-[16rem] truncate">{r.activity || '—'}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{r.provider}</td>
                <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                  {fmtDate(r.date)}{r.time && <span className="text-slate-400"> · {r.time}</span>}
                  {r.date > today && <span className="ml-1.5 rounded-full bg-sky-50 text-sky-700 px-1.5 py-0.5 text-[10px] font-semibold">{t('badge_upcoming')}</span>}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-900 whitespace-nowrap">{fmtMoney(r.amount)}</td>
                <td className="py-3 px-4"><Badge variant={STATUS_STYLES[r.status]}>{STATUS_LABELS[r.status] ?? r.status}</Badge></td>
                <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">{r.origin === 'turitop' ? `TuriTop${r.channel ? ' · ' + r.channel : ''}` : 'Exploria'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="py-12 text-center text-sm text-slate-400">{t('empty')}</p>}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-40 hover:text-primary">
            <ChevronLeft className="w-4 h-4" />{t('page_prev')}
          </button>
          <span className="text-xs text-slate-500">{t('page_of', { page: safePage, pages })}</span>
          <button type="button" disabled={safePage >= pages} onClick={() => setPage(safePage + 1)} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-40 hover:text-primary">
            {t('page_next')}<ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
