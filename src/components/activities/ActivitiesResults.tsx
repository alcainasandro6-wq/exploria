'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X, LayoutGrid, List, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { ActivityFilters } from '@/components/activities/ActivityFilters'
import { Reveal } from '@/components/ui/reveal'
import { CITIES } from '@/lib/constants'
import type { ActivityListItem } from '@/lib/services/activities'
import type { Category } from '@/types/database'

interface ActivitiesResultsProps {
  activities: ActivityListItem[]
  categories: Category[]
  filters: { q: string; category: string; city: string; sort: string; maxPrice: string; duration: string; lang: string }
}

export function ActivitiesResults({ activities, categories, filters }: ActivitiesResultsProps) {
  const t = useTranslations('activities')
  const tp = useTranslations('activities_page')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState(filters.q)
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const SORT_OPTIONS = [
    { value: 'relevance', label: t('sort_relevance') },
    { value: 'rating', label: t('sort_rating') },
    { value: 'price_asc', label: t('sort_price_asc') },
    { value: 'price_desc', label: t('sort_price_desc') },
    { value: 'popular', label: tp('sort_popular') },
  ]

  const pushFilters = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next }
    const params = new URLSearchParams()
    if (merged.q) params.set('q', merged.q)
    if (merged.category) params.set('category', merged.category)
    if (merged.city) params.set('city', merged.city)
    if (merged.sort && merged.sort !== 'relevance') params.set('sort', merged.sort)
    if (merged.maxPrice) params.set('maxPrice', merged.maxPrice)
    if (merged.duration) params.set('duration', merged.duration)
    if (merged.lang) params.set('lang', merged.lang)
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
                  {c.name}{!c.enabled ? ` (${tc('coming_soon')})` : ''}
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
              placeholder={tp('search_placeholder')}
              className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); pushFilters({ q: '' }) }} className="text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-1.5 rounded-lg text-sm shrink-0 transition-colors">
              {tc('search')}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">
          <aside className="hidden md:block w-60 lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 lg:p-6 sticky top-[184px]">
              <ActivityFilters categories={categories} values={filters} onChange={pushFilters} />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <p className="text-sm font-semibold text-slate-900">
                {tp('results_count', { count: activities.length })}
                {activeCategory && (
                  <span className="text-slate-400 font-normal ml-1">
                    · {categories.find((c) => c.slug === activeCategory)?.name}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(true)}
                  className="md:hidden flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {tp('filters_button')}
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
                <h3 className="text-lg font-bold text-slate-900 mb-2">{tp('no_results_title')}</h3>
                <p className="text-slate-500 text-sm mb-6">{tp('no_results_desc')}</p>
                <button onClick={() => router.push('/activities')} className="text-sm font-semibold text-primary hover:underline">
                  {tp('no_results_cta')}
                </button>
              </div>
            ) : view === 'list' ? (
              <Reveal className="space-y-4">
                {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} compact />)}
              </Reveal>
            ) : (
              <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
              </Reveal>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[min(85vw,320px)] bg-white shadow-2xl overflow-y-auto p-5 sm:p-6">
            <ActivityFilters categories={categories} values={filters} onChange={pushFilters} onClose={() => setShowFilters(false)} />
          </div>
        </div>
      )}
    </>
  )
}
