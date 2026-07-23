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
    <div className="bg-slate-50 rounded-3xl p-6 sm:p-8">
      {/* Header — title left, description right, like the reference */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#070D1F] tracking-tight">
          Actividades destacadas
        </h2>
        <p className="text-sm text-slate-500 max-w-sm sm:text-right">
          Desde escapadas junto al mar hasta rutas por la naturaleza — descubre tu próxima experiencia.
        </p>
      </div>

      {/* Card row */}
      <div ref={scrollerRef} className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
        {activities.map((activity) => {
          const cover = activity.images?.find((img) => img.is_cover)?.url || activity.images?.[0]?.url || FALLBACK_IMAGE
          return (
            <Link
              key={activity.id}
              href={`/activities/${activity.slug}`}
              className="group shrink-0 snap-start w-[220px] sm:w-[calc(25%-15px)] sm:min-w-[220px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={cover}
                  alt={activity.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 220px, 25vw"
                />
                <span className="absolute top-3 left-3 bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  Desde {formatPrice(activity.price_from)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-[#070D1F] leading-snug line-clamp-1 mb-1.5">
                  {activity.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {activity.category?.name || activity.city}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Nav arrows */}
      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          onClick={() => scrollByCards(-1)}
          aria-label="Anterior"
          className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollByCards(1)}
          aria-label="Siguiente"
          className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
