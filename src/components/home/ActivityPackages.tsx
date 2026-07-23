import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Compass } from 'lucide-react'
import type { ActivityListItem } from '@/lib/services/activities'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'

interface ActivityPackagesProps {
  activities: ActivityListItem[]
}

export function ActivityPackages({ activities }: ActivityPackagesProps) {
  if (activities.length === 0) return null

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Left column — heading + copy + link */}
      <div className="lg:col-span-1">
        <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-3">
          Paquetes de experiencias
        </h2>
        <p className="text-[15px] text-slate-500 leading-relaxed mb-6">
          Combinaciones cuidadas de actividades, pensadas para sacarle el máximo partido a tu visita a Torrevieja.
        </p>
        <Link
          href="/activities"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          Ver todas las actividades <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Right — large package cards */}
      <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
        {activities.slice(0, 2).map((activity) => {
          const cover = activity.images?.find((img) => img.is_cover)?.url || activity.images?.[0]?.url || FALLBACK_IMAGE
          return (
            <Link
              key={activity.id}
              href={`/activities/${activity.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] block"
            >
              <Image
                src={cover}
                alt={activity.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>

              <div className="absolute bottom-0 inset-x-0 p-5">
                <h3 className="text-white font-bold text-lg leading-snug mb-1.5">
                  {activity.title}
                </h3>
                {activity.short_description && (
                  <p className="text-white/75 text-[15px] leading-relaxed line-clamp-2">
                    {activity.short_description}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
