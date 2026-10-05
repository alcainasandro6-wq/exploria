import { getTranslations } from 'next-intl/server'
import { ActivitiesResults } from '@/components/activities/ActivitiesResults'
import { getPublishedActivities, type ActivitySearchFilters } from '@/lib/services/activities'
import { getCategories } from '@/lib/services/categories'
import { CITIES } from '@/lib/constants'

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string; sort?: string; maxPrice?: string; duration?: string; lang?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ''
  const category = params.category ?? ''
  const city = params.city ?? CITIES[0].slug
  const sort = (params.sort ?? 'relevance') as NonNullable<ActivitySearchFilters['sort']>

  const maxPrice = /^\d+$/.test(params.maxPrice ?? '') ? params.maxPrice! : ''
  const duration = ['under1', '1to3', '3to6', 'full'].includes(params.duration ?? '') ? params.duration! : ''
  const lang = ['es', 'en', 'fr', 'de', 'pl', 'ru'].includes(params.lang ?? '') ? params.lang! : ''

  const cityName = CITIES.find((c) => c.slug === city)?.name ?? CITIES[0].name

  const [activities, categories, t] = await Promise.all([
    getPublishedActivities({ q, categorySlug: category || undefined, city: cityName, sort, maxPrice: maxPrice ? Number(maxPrice) : undefined, duration: (duration || undefined) as ActivitySearchFilters['duration'], language: lang || undefined }),
    getCategories(),
    getTranslations('activities_page'),
  ])

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-[#0A0F1E] via-primary-dark to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 60%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-5 leading-[1.05]">
            {t('hero_title')}
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block h-10">
            <path d="M0 40L1440 40L1440 10C1200 40 960 0 720 20C480 40 240 0 0 10L0 40Z" fill="#F7F9FC" />
          </svg>
        </div>
      </div>

      <ActivitiesResults activities={activities} categories={categories} filters={{ q, category, city, sort, maxPrice, duration, lang }} />
    </div>
  )
}
