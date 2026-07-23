import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { formatPrice, formatDuration } from '@/lib/utils'
import type { ActivityListItem } from '@/lib/services/activities'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

interface ActivitiesMarqueeProps {
  activities: ActivityListItem[]
}

export function ActivitiesMarquee({ activities }: ActivitiesMarqueeProps) {
  // Duplicated once so the track can loop seamlessly: translating exactly
  // -50% of the (now doubled) track width lands back on the first copy.
  const track = [...activities, ...activities]

  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10" />

      <div className="flex w-max gap-6 marquee-track">
        {track.map((activity, i) => {
          const cover = activity.images?.find((img) => img.is_cover)?.url || activity.images?.[0]?.url || FALLBACK_IMAGE
          return (
            <Link
              key={`${activity.id}-${i}`}
              href={`/activities/${activity.slug}`}
              className="group relative shrink-0 w-[260px] sm:w-[300px] rounded-2xl overflow-hidden shadow-lg bg-slate-900"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={cover}
                  alt={activity.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="300px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute top-3 right-3 text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {formatDuration(activity.duration_minutes)}
                </span>
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <p className="text-white font-bold text-[15px] leading-snug line-clamp-2 mb-1.5">
                    {activity.title}
                  </p>
                  <p className="text-white/80 text-sm font-semibold">
                    {formatPrice(activity.price_from)}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
