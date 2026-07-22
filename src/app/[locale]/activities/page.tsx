import { ActivitiesResults } from '@/components/activities/ActivitiesResults'
import { getPublishedActivities, type ActivitySearchFilters } from '@/lib/services/activities'
import { getCategories } from '@/lib/services/categories'
import { CITIES } from '@/lib/constants'

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string; sort?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ''
  const category = params.category ?? ''
  const city = params.city ?? CITIES[0].slug
  const sort = (params.sort ?? 'relevance') as NonNullable<ActivitySearchFilters['sort']>

  const cityName = CITIES.find((c) => c.slug === city)?.name ?? CITIES[0].name

  const [activities, categories] = await Promise.all([
    getPublishedActivities({ q, categorySlug: category || undefined, city: cityName, sort }),
    getCategories(),
  ])

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-[#0A0F1E] via-primary-dark to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #60a5fa 0%, transparent 60%), radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full mb-5">
            {cityName} · Costa Blanca
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 leading-[1.05]">
            Descubre las mejores<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">actividades</span> cerca del mar
          </h1>
          <p className="text-blue-100/80 text-lg mb-2 max-w-xl mx-auto">
            {activities.length} experiencias con garantía de calidad, verificadas por proveedores locales
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block h-10">
            <path d="M0 40L1440 40L1440 10C1200 40 960 0 720 20C480 40 240 0 0 10L0 40Z" fill="#F7F9FC" />
          </svg>
        </div>
      </div>

      <ActivitiesResults activities={activities} categories={categories} filters={{ q, category, city, sort }} />
    </div>
  )
}
