import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowUpRight } from 'lucide-react'
import { ActivitiesCarousel } from '@/components/home/ActivitiesCarousel'
import { getPublishedActivities } from '@/lib/services/activities'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export async function FeaturedActivities() {
  const t = await getTranslations('home')
  const activities = (await getPublishedActivities({ sort: 'relevance' })).slice(0, 10)

  if (activities.length === 0) return null

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
              Mejor valoradas
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight leading-none">
              {t('featured_title')}
            </h2>
          </div>
          <Link
            href="/activities"
            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <ActivitiesCarousel activities={activities} />

        <div className="mt-10 text-center md:hidden">
          <Link
            href="/activities"
            className={cn(buttonVariants({ variant: 'outline' }), 'border-primary text-primary hover:bg-primary hover:text-white font-semibold')}
          >
            Ver todas las actividades
          </Link>
        </div>
      </div>
    </section>
  )
}
