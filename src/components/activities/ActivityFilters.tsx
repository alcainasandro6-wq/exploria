'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'

export function ActivityFilters() {
  const [priceRange, setPriceRange] = useState([0, 300])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Buscar</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar actividades..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Categorías</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
              />
              <span className="text-sm text-slate-700 group-hover:text-[#0066FF] transition-colors flex items-center gap-2">
                <span>{cat.icon}</span>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Precio por persona</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>€{priceRange[0]}</span>
            <span>€{priceRange[1]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-[#0066FF]"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Duración</h3>
        <div className="space-y-2">
          {['Menos de 1h', '1-3 horas', '3-6 horas', 'Día completo'].map((duration) => (
            <label key={duration} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
              />
              <span className="text-sm text-slate-700">{duration}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Idioma disponible</h3>
        <div className="space-y-2">
          {[
            { code: 'es', label: '🇪🇸 Español' },
            { code: 'en', label: '🇬🇧 English' },
            { code: 'de', label: '🇩🇪 Deutsch' },
            { code: 'fr', label: '🇫🇷 Français' },
            { code: 'pl', label: '🇵🇱 Polski' },
            { code: 'ru', label: '🇷🇺 Русский' },
          ].map((lang) => (
            <label key={lang.code} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
              />
              <span className="text-sm text-slate-700">{lang.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button className="w-full text-sm text-slate-500 hover:text-[#0066FF] transition-colors py-2">
        Limpiar filtros
      </button>
    </div>
  )
}
