import { useTranslations } from 'next-intl'

const stats = [
  { key: 'activities', value: '150+', label: 'stats_activities' },
  { key: 'providers', value: '45+', label: 'stats_providers' },
  { key: 'customers', value: '8.000+', label: 'stats_customers' },
  { key: 'reviews', value: '2.400+', label: 'stats_reviews' },
]

export function StatsSection() {
  const t = useTranslations('home')

  return (
    <section className="py-16 bg-[#0066FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.key} className="text-white">
              <div className="text-4xl font-extrabold mb-1">{stat.value}</div>
              <div className="text-blue-100 text-sm font-medium">{t(stat.label as 'stats_activities' | 'stats_providers' | 'stats_customers' | 'stats_reviews')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
