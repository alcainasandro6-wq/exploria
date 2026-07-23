import { getTranslations } from 'next-intl/server'
import { ActivitiesMarquee } from '@/components/home/ActivitiesMarquee'
import { getPublishedActivities } from '@/lib/services/activities'

export async function FeaturedActivities() {
  const t = await getTranslations('home')
  const activities = (await getPublishedActivities({ sort: 'relevance' })).slice(0, 20)

  if (activities.length === 0) return null

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="text-center mb-14 px-4">
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

      <ActivitiesMarquee activities={activities} />
    </section>
  )
}
