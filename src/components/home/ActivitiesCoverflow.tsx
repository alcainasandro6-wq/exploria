'use client'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import { EffectCoverflow, Navigation } from 'swiper/modules'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { ActivityListItem } from '@/lib/services/activities'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/navigation'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

interface ActivitiesCoverflowProps {
  activities: ActivityListItem[]
}

export function ActivitiesCoverflow({ activities }: ActivitiesCoverflowProps) {
  const swiperRef = useRef<SwiperType | null>(null)

  return (
    <div className="activities-coverflow relative">
      <Swiper
        modules={[EffectCoverflow, Navigation]}
        onSwiper={(swiper) => { swiperRef.current = swiper }}
        effect="coverflow"
        grabCursor
        centeredSlides
        initialSlide={Math.min(2, activities.length - 1)}
        slidesPerView="auto"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 160,
          modifier: 1.4,
          slideShadows: false,
        }}
        className="!py-6"
      >
        {activities.map((activity) => {
          const cover = activity.images?.find((img) => img.is_cover)?.url || activity.images?.[0]?.url || FALLBACK_IMAGE
          return (
            <SwiperSlide key={activity.id} className="!w-[190px] sm:!w-[210px]">
              <Link href={`/activities/${activity.slug}`} className="group block rounded-2xl overflow-hidden shadow-xl bg-slate-900">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={cover}
                    alt={activity.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="210px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <p className="text-white font-bold text-sm leading-snug line-clamp-2 mb-1">
                      {activity.title}
                    </p>
                    <p className="text-white/70 text-xs font-semibold">
                      {formatPrice(activity.price_from)}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Anterior"
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Siguiente"
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
