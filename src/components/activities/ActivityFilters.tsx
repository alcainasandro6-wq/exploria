'use client'

import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const DURATIONS = [
  { label: '< 1 hora', value: 'under1' },
  { label: '1–3 h', value: '1to3' },
  { label: '3–6 h', value: '3to6' },
  { label: 'Día completo', value: 'full' },
]

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'pl', label: 'Polski' },
  { code: 'ru', label: 'Русский' },
]

interface ActivityFiltersProps {
  onClose?: () => void
}

export function ActivityFilters({ onClose }: ActivityFiltersProps) {
  const [search, setSearch] = useState('')
  const [priceMax, setPriceMax] = useState(200)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDurations, setSelectedDurations] = useState<string[]>([])
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const totalActive = selectedCategories.length + selectedDurations.length + selectedLangs.length

  const clearAll = () => {
    setSearch('')
    setPriceMax(200)
    setSelectedCategories([])
    setSelectedDurations([])
    setSelectedLangs([])
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-600" />
          <span className="font-bold text-slate-900 text-sm">Filtros</span>
          {totalActive > 0 && (
            <span className="text-xs bg-[#005B8D] text-white font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalActive}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalActive > 0 && (
            <button onClick={clearAll} className="text-xs text-[#005B8D] hover:text-[#003654] font-semibold transition-colors">
              Limpiar
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <FilterSection title="Buscar">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nombre o tipo de actividad..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005B8D] focus:bg-white transition-colors"
          />
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title="Categorías">
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat.slug)
            return (
              <button
                key={cat.slug}
                onClick={() => toggle(selectedCategories, cat.slug, setSelectedCategories)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left',
                  active
                    ? 'bg-[#005B8D]/10 text-[#005B8D] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <span className="flex-1">{cat.name}</span>
                {active && <X className="w-3 h-3 shrink-0" />}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Precio por persona">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Hasta</span>
            <span className="text-sm font-bold text-slate-900">{priceMax === 200 ? 'Cualquier precio' : `${priceMax} €`}</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={priceMax}
            onChange={(e) => setPriceMax(parseInt(e.target.value))}
            className="w-full h-1.5 accent-[#005B8D] cursor-pointer"
          />
          <div className="flex gap-2">
            {[30, 60, 100, 150].map(p => (
              <button
                key={p}
                onClick={() => setPriceMax(p)}
                className={cn(
                  'flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors',
                  priceMax === p ? 'bg-[#005B8D] text-white border-[#005B8D]' : 'border-slate-200 text-slate-600 hover:border-[#005B8D]'
                )}
              >
                ≤{p}€
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Duration */}
      <FilterSection title="Duración">
        <div className="grid grid-cols-2 gap-1.5">
          {DURATIONS.map((d) => {
            const active = selectedDurations.includes(d.value)
            return (
              <button
                key={d.value}
                onClick={() => toggle(selectedDurations, d.value, setSelectedDurations)}
                className={cn(
                  'text-xs px-3 py-2 rounded-xl border font-medium transition-all text-center',
                  active
                    ? 'bg-[#005B8D] text-white border-[#005B8D]'
                    : 'border-slate-200 text-slate-600 hover:border-[#005B8D] hover:text-[#005B8D]'
                )}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </FilterSection>

      {/* Languages */}
      <FilterSection title="Idioma disponible">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => {
            const active = selectedLangs.includes(lang.code)
            return (
              <button
                key={lang.code}
                onClick={() => toggle(selectedLangs, lang.code, setSelectedLangs)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border font-medium transition-all',
                  active
                    ? 'bg-[#005B8D] text-white border-[#005B8D]'
                    : 'border-slate-200 text-slate-600 hover:border-[#005B8D]'
                )}
              >
                {lang.label}
              </button>
            )
          })}
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
