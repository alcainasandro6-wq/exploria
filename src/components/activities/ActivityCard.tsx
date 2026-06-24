import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock, Star, BadgeCheck, ArrowUpRight, Heart } from 'lucide-react'
import { formatPrice, formatDuration, cn } from '@/lib/utils'
import type { Activity } from '@/types/database'

interface ActivityCardProps {
  activity: Activity
  compact?: boolean
}

export function ActivityCard({ activity, compact = false }: ActivityCardProps) {
  const coverImage = activity.images?.find((img) => img.is_cover)?.url ||
    activity.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

  if (compact) {
    return (
      <Link href={`/activities/${activity.slug}`} className="group flex gap-4 bg-white rounded-2xl border border-slate-100 p-3 hover:border-[#1A56FF]/30 hover:shadow-md transition-all">
        <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0">
          <Image src={coverImage} alt={activity.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="96px" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{activity.category?.name}</p>
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A56FF] transition-colors mb-1.5">
            {activity.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {formatDuration(activity.duration_minutes)}
            </div>
            <p className="text-sm font-black text-[#070D1F]">{formatPrice(activity.price_from)}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/activities/${activity.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100/80 shadow-[0_1px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(26,86,255,0.14)] hover:-translate-y-1 transition-all duration-300">

        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <Image
            src={coverImage}
            alt={activity.title}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D1F]/55 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {activity.featured && (
              <span className="bg-[#1A56FF] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Destacado
              </span>
            )}
            {activity.cancellation_policy?.toLowerCase().includes('gratuita') && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Cancelación gratis
              </span>
            )}
          </div>

          {/* Favorite */}
          <button
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500 transition-colors" />
          </button>

          {/* Bottom: category + duration */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            {activity.category?.name && (
              <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {activity.category.name}
              </span>
            )}
            <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {formatDuration(activity.duration_minutes)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Provider */}
          {activity.provider && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activity.provider.company_name}
              </span>
              {activity.provider.is_verified && (
                <BadgeCheck className="w-3 h-3 text-[#1A56FF]" />
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-[15px] font-bold text-[#070D1F] leading-snug mb-3 line-clamp-2 group-hover:text-[#1A56FF] transition-colors duration-200">
            {activity.title}
          </h3>

          {/* Rating */}
          {activity.review_count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn('w-3 h-3', s <= Math.round(activity.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">{activity.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({activity.review_count})</span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Desde</p>
              <p className="text-xl font-black text-[#070D1F] leading-none">
                {formatPrice(activity.price_from)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ persona</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1A56FF]/8 group-hover:bg-[#1A56FF] flex items-center justify-center transition-colors duration-300">
              <ArrowUpRight className="w-4 h-4 text-[#1A56FF] group-hover:text-white transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
