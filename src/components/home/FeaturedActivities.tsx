import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { ActivitiesCoverflow } from '@/components/home/ActivitiesCoverflow'
import { getPublishedActivities } from '@/lib/services/activities'
import { getCategories } from '@/lib/services/categories'
import { cn } from '@/lib/utils'

export async function FeaturedActivities() {
  const t = await getTranslations('home')
  const [allActivities, categories] = await Promise.all([
    getPublishedActivities({ sort: 'relevance' }),
    getCategories(),
  ])
  const activities = allActivities.slice(0, 10)

  if (activities.length === 0) return null

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
            Actividades
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight leading-none mb-4">
            {t('featured_title')}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {t('featured_subtitle')}
          </p>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-14">
          <Link
            href="/activities"
            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-primary text-white shadow-md shadow-primary/25"
          >
            Todas
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.slug}
              href={`/activities?category=${cat.slug}`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/activities"
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold',
              'bg-white text-slate-900 border border-slate-200 hover:border-primary hover:text-primary transition-colors'
            )}
          >
            Ver más <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ActivitiesCoverflow activities={activities} />
      </div>
    </section>
  )
}
