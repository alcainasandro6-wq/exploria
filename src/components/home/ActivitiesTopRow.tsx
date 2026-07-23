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
        <h2 className="text-lg sm:text-xl font-semibold text-black">
          Actividades destacadas
        </h2>
        <p className="text-[15px] text-black max-w-xs sm:text-right leading-relaxed">
          Desde escapadas junto al mar hasta rutas por la naturaleza, descubre tu próxima experiencia.
        </p>
      </div>

      {/* Card row — same proportions as the "Guías y consejos" blog cards */}
      <div ref={scrollerRef} className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
        {activities.map((activity) => {
          const cover = activity.images?.find((img) => img.is_cover)?.url || activity.images?.[0]?.url || FALLBACK_IMAGE
          return (
            <Link
              key={activity.id}
              href={`/activities/${activity.slug}`}
              className="group shrink-0 snap-start w-[220px] sm:w-[calc(25%-18px)] sm:min-w-[220px] bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={cover}
                  alt={activity.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 220px, 25vw"
                />
                <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  desde {formatPrice(activity.price_from)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                  {activity.title}
                </h3>
                {activity.short_description && (
                  <p className="text-xs text-slate-400 leading-snug line-clamp-1 mb-2">
                    {activity.short_description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  {activity.category?.name || activity.city}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer — view more (left), nav arrows (right) */}
      <div className="flex items-center justify-between mt-6">
        <Link
          href="/activities"
          className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-primary-dark transition-colors"
        >
          Ver más
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByCards(-1)}
            aria-label="Anterior"
            className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollByCards(1)}
            aria-label="Siguiente"
            className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
