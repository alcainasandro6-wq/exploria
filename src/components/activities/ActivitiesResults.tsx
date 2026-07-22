'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { ActivityFilters } from '@/components/activities/ActivityFilters'
import { CITIES } from '@/lib/constants'
import type { ActivityListItem } from '@/lib/services/activities'
import type { Category } from '@/types/database'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Más reservados' },
]

interface ActivitiesResultsProps {
  activities: ActivityListItem[]
  categories: Category[]
  filters: { q: string; category: string; city: string; sort: string }
}

export function ActivitiesResults({ activities, categories, filters }: ActivitiesResultsProps) {
  const router = useRouter()
  const [search, setSearch] = useState(filters.q)
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const pushFilters = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next }
    const params = new URLSearchParams()
    if (merged.q) params.set('q', merged.q)
    if (merged.category) params.set('category', merged.category)
    if (merged.city) params.set('city', merged.city)
    if (merged.sort && merged.sort !== 'relevance') params.set('sort', merged.sort)
    const qs = params.toString()
    router.push(qs ? `/activities?${qs}` : '/activities')
  }

  const activeCategory = filters.category || null

  return (
    <>
      {/* City + search */}
      <div className="sticky top-20 z-20 bg-[#F7F9FC]/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <select
              value={filters.city || CITIES[0].slug}
              onChange={(e) => pushFilters({ city: e.target.value })}
              className="text-sm font-semibold text-slate-700 outline-none bg-transparent cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug} disabled={!c.enabled}>
                  {c.name}{!c.enabled ? ' (próximamente)' : ''}
                </option>
              ))}
            </select>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); pushFilters({ q: search }) }}
            className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buceo, kayak, catamarán, tours..."
              className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); pushFilters({ q: '' }) }} className="text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-1.5 rounded-lg text-sm shrink-0 transition-colors">
              Buscar
            </button>
          </form>
        </div>

        {/* Category pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => pushFilters({ category: '' })}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                !activeCategory ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => pushFilters({ category: activeCategory === cat.slug ? '' : cat.slug })}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.slug ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-[184px]">
              <ActivityFilters />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <p className="text-sm font-semibold text-slate-900">
                {activities.length}
                <span className="text-slate-400 font-normal ml-1">
                  {activities.length === 1 ? 'actividad' : 'actividades'}
                  {activeCategory && ` · ${categories.find((c) => c.slug === activeCategory)?.name}`}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                </button>
                <div className="relative">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                    <select
                      value={filters.sort || 'relevance'}
                      onChange={(e) => pushFilters({ sort: e.target.value })}
                      className="appearance-none bg-transparent outline-none cursor-pointer pr-5 text-sm font-medium text-slate-700"
                    >
                      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>
                <div className="hidden sm:flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No encontramos actividades</h3>
                <p className="text-slate-500 text-sm mb-6">Prueba con otros términos o elimina los filtros.</p>
                <button onClick={() => router.push('/activities')} className="text-sm font-semibold text-primary hover:underline">
                  Ver todas las actividades
                </button>
              </div>
            ) : view === 'list' ? (
              <div className="space-y-4">
                {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} compact />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto p-6">
            <ActivityFilters onClose={() => setShowFilters(false)} />
          </div>
        </div>
      )}
    </>
  )
}
