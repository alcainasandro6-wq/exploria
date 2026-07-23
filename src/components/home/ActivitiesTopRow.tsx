'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { ActivityListItem } from '@/lib/services/activities'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

interface ActivitiesTopRowProps {
  activities: ActivityListItem[]
}

export function ActivitiesTopRow({ activities }: ActivitiesTopRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth / 2), behavior: 'smooth' })
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-6">
      {/* Header — title left, description right, like the reference */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-[#070D1F]">
          Actividades destacadas
        </h2>
        <p className="text-xs text-slate-400 max-w-xs sm:text-right leading-relaxed">
          Desde escapadas junto al mar hasta rutas por la naturaleza, descubre tu próxima experiencia.
        </p>
      </div>

      {/* Card row */}
      <div ref={scrollerRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
        {activities.map((activity) => {
          const cover = activity.images?.find((img) => img.is_cover)?.url || activity.images?.[0]?.url || FALLBACK_IMAGE
          return (
            <Link
              key={activity.id}
              href={`/activities/${activity.slug}`}
              className="group shrink-0 snap-start w-[160px] sm:w-[calc(25%-12px)] sm:min-w-[160px] rounded-xl overflow-hidden"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                <Image
                  src={cover}
                  alt={activity.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 160px, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                  desde {formatPrice(activity.price_from)}
                </span>
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <h3 className="font-bold text-[13px] text-white leading-snug line-clamp-1 mb-0.5">
                    {activity.title}
                  </h3>
                  {activity.short_description && (
                    <p className="text-[11px] text-white/70 leading-snug line-clamp-1 mb-1">
                      {activity.short_description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-[11px] text-white/85">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0 fill-red-500/20" />
                    {activity.category?.name || activity.city}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer — view more (left), nav arrows (right) */}
      <div className="flex items-center justify-between mt-5">
        <Link href="/activities" className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors">
          Ver más
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByCards(-1)}
            aria-label="Anterior"
            className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollByCards(1)}
            aria-label="Siguiente"
            className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
