'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { CITIES } from '@/lib/constants'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { AdminFinancialFilters } from '@/lib/dashboard-date-ranges'

interface AdminFinancialFilterBarProps {
  filters: AdminFinancialFilters
}

export function AdminFinancialFilterBar({ filters }: AdminFinancialFilterBarProps) {
  const t = useTranslations('admin_home_page')
  const router = useRouter()

  const pushFilters = (next: Partial<AdminFinancialFilters>) => {
    const merged = { ...filters, ...next }
    const params = new URLSearchParams()
    if (merged.range) params.set('range', merged.range)
    if (merged.city) params.set('city', merged.city)
    const qs = params.toString()
    router.push(qs ? `/dashboard/admin?${qs}` : '/dashboard/admin')
  }

  const RANGE_OPTIONS: { value: AdminFinancialFilters['range']; label: string }[] = [
    { value: '', label: t('filter_range_all') },
    { value: 'day', label: t('filter_range_day') },
    { value: 'week', label: t('filter_range_week') },
    { value: 'month', label: t('filter_range_month') },
    { value: 'year', label: t('filter_range_year') },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value || 'all'}
            onClick={() => pushFilters({ range: opt.value })}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              filters.range === opt.value ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Select value={filters.city || 'all'} onValueChange={(v) => pushFilters({ city: v === 'all' ? '' : v })}>
        <SelectTrigger className="w-48 h-9 text-xs">
          <SelectValue placeholder={t('filter_city_placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filter_city_all')}</SelectItem>
          {CITIES.map((c) => (
            <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
