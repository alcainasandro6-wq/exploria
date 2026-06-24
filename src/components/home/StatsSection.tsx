'use client'

import { useTranslations } from 'next-intl'

const stats = [
  { key: 'activities', value: '150+', label: 'stats_activities', icon: '🏄' },
  { key: 'providers', value: '45+', label: 'stats_providers', icon: '🏢' },
  { key: 'customers', value: '8.000+', label: 'stats_customers', icon: '😊' },
  { key: 'reviews', value: '2.400+', label: 'stats_reviews', icon: '⭐' },
]

export function StatsSection() {
  const t = useTranslations('home')

  return (
    <section className="py-16 bg-[#0066FF] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='4' cy='4' r='1.5'/%3E%3C/g%3E%3C/svg%3E")` }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.key} className="text-white">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-4xl md:text-5xl font-black mb-1 tracking-tight">{stat.value}</div>
              <div className="text-blue-100 text-sm font-medium">{t(stat.label as 'stats_activities' | 'stats_providers' | 'stats_customers' | 'stats_reviews')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
