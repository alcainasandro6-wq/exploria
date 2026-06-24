'use client'

import { useTranslations } from 'next-intl'

const STATS = [
  { key: 'activities', value: '150+', label: 'stats_activities' },
  { key: 'providers',  value: '45+',  label: 'stats_providers' },
  { key: 'customers',  value: '8.000+', label: 'stats_customers' },
  { key: 'reviews',    value: '2.400+', label: 'stats_reviews' },
] as const

export function StatsSection() {
  const t = useTranslations('home')

  return (
    <section className="py-20 bg-[#070D1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {STATS.map((stat) => (
            <div key={stat.key} className="bg-[#070D1F] px-8 py-10 text-center">
              <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-3 leading-none">
                {stat.value}
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em]">
                {t(stat.label as 'stats_activities' | 'stats_providers' | 'stats_customers' | 'stats_reviews')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
