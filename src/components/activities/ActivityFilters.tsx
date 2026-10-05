'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/database'

export interface ActivityFilterValues {
  category: string
  maxPrice: string
  duration: string
  lang: string
}

const MAX_PRICE = 200

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
]

interface ActivityFiltersProps {
  categories: Category[]
  values: ActivityFilterValues
  /** Applies a partial change by updating the URL (server re-filters). */
  onChange: (next: Partial<ActivityFilterValues>) => void
  onClose?: () => void
}

export function ActivityFilters({ categories, values, onChange, onClose }: ActivityFiltersProps) {
  const t = useTranslations('activities_page')
  // Slider drag value; null means "mirror the URL value".
  const [draftPrice, setDraftPrice] = useState<number | null>(null)
  const price = draftPrice ?? (values.maxPrice ? parseInt(values.maxPrice) : MAX_PRICE)

  const DURATIONS = [
    { label: t('dur_under1'), value: 'under1' },
    { label: t('dur_1to3'), value: '1to3' },
    { label: t('dur_3to6'), value: '3to6' },
    { label: t('dur_full'), value: 'full' },
  ]

  const totalActive = [values.category, values.maxPrice, values.duration, values.lang].filter(Boolean).length
  const applyPrice = (p: number) => { setDraftPrice(null); onChange({ maxPrice: p >= MAX_PRICE ? '' : String(p) }) }
  // Re-clicking the active option clears it (single-select per group).
  const pick = (key: keyof ActivityFilterValues, val: string) => onChange({ [key]: values[key] === val ? '' : val })

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          <span className="font-bold text-slate-900 text-sm">{t('filters_title')}</span>
          {totalActive > 0 && (
            <span className="text-xs bg-primary text-white font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalActive}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalActive > 0 && (
            <button onClick={() => onChange({ category: '', maxPrice: '', duration: '', lang: '' })} className="text-xs text-primary hover:text-primary-dark font-semibold transition-colors">
              {t('filters_clear')}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors" aria-label={t('filters_clear')}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <FilterSection title={t('filters_categories')}>
          <div className="space-y-1">
            {categories.map((cat) => {
              const active = values.category === cat.slug
              return (
                <button
                  key={cat.id}
                  onClick={() => pick('category', cat.slug)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left',
                    active ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className="flex-1">{cat.name}</span>
                  {active && <X className="w-3 h-3 shrink-0" />}
                </button>
              )
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title={t('filters_price')}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{t('filters_up_to')}</span>
            <span className="text-sm font-bold text-slate-900">{price >= MAX_PRICE ? t('filters_any_price') : `${price} €`}</span>
          </div>
          <input
            type="range"
            min={10}
            max={MAX_PRICE}
            step={5}
            value={price}
            onChange={(e) => setDraftPrice(parseInt(e.target.value))}
            onPointerUp={() => applyPrice(price)}
            onKeyUp={() => applyPrice(price)}
            className="w-full h-1.5 accent-primary cursor-pointer"
          />
          <div className="flex gap-2">
            {[30, 60, 100, 150].map((p) => (
              <button
                key={p}
                onClick={() => applyPrice(p)}
                className={cn(
                  'flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors',
                  values.maxPrice === String(p) ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary'
                )}
              >
                ≤{p}€
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      <FilterSection title={t('filters_duration')}>
        <div className="grid grid-cols-2 gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => pick('duration', d.value)}
              className={cn(
                'text-xs px-3 py-2 rounded-xl border font-medium transition-all text-center',
                values.duration === d.value ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t('filters_language')}>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => pick('lang', lang.code)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border font-medium transition-all',
                values.lang === lang.code ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{title}</h4>
      {children}
    </div>
  )
}
