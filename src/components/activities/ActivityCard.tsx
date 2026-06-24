import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock, Star, Users, Heart, BadgeCheck, ArrowRight } from 'lucide-react'
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

  const ratingLabel = activity.rating >= 4.8 ? 'Excepcional' : activity.rating >= 4.5 ? 'Excelente' : activity.rating >= 4.0 ? 'Muy bueno' : 'Bueno'

  return (
    <Link href={`/activities/${activity.slug}`} className="group block">
      <div className={cn(
        'bg-white rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_40px_rgba(0,102,255,0.15)] transition-all duration-400 hover:-translate-y-1.5',
        compact ? 'flex gap-3' : 'flex flex-col'
      )}>
        {/* Image */}
        <div className={cn('relative overflow-hidden shrink-0', compact ? 'w-28 h-24 rounded-2xl m-3' : 'h-60 rounded-none')}>
          <Image
            src={coverImage}
            alt={activity.title}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Gradient overlay */}
          {!compact && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          )}

          {/* Top badges */}
          {!compact && (
            <div className="absolute top-3.5 left-3.5 flex gap-1.5">
              {activity.featured && (
                <span className="bg-[#0066FF] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Destacado
                </span>
              )}
              {activity.cancellation_policy?.toLowerCase().includes('gratuita') && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Cancelación gratis
                </span>
              )}
            </div>
          )}

          {/* Favorite */}
          {!compact && (
            <button
              className="absolute top-3.5 right-3.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-md"
              onClick={(e) => e.preventDefault()}
              aria-label="Añadir a favoritos"
            >
              <Heart className="w-3.5 h-3.5 text-slate-500 hover:text-red-500 transition-colors" />
            </button>
          )}

          {/* Bottom info on image */}
          {!compact && activity.category && (
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between">
              <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {activity.category.icon} {activity.category.name}
              </span>
              <span className="text-[11px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(activity.duration_minutes)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn('flex flex-col', compact ? 'flex-1 py-3 pr-3' : 'p-5')}>
          {/* Provider */}
          {activity.provider && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                {activity.provider.company_name}
              </span>
              {activity.provider.is_verified && (
                <BadgeCheck className="w-3 h-3 text-[#0066FF]" />
              )}
            </div>
          )}

          {/* Title */}
          <h3 className={cn(
            'font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#0066FF] transition-colors duration-200',
            compact ? 'text-sm line-clamp-2' : 'text-[15px] line-clamp-2'
          )}>
            {activity.title}
          </h3>

          {/* Compact: duration */}
          {compact && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-auto">
              <Clock className="w-3 h-3" />
              {formatDuration(activity.duration_minutes)}
              <span className="mx-1">·</span>
              <Users className="w-3 h-3" />
              Máx. {activity.max_participants}
            </div>
          )}

          {/* Rating */}
          {activity.review_count > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'w-3 h-3',
                      s <= Math.round(activity.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">{activity.rating.toFixed(1)}</span>
              <span className="text-xs font-medium text-slate-500">{ratingLabel}</span>
              <span className="text-xs text-slate-400">({activity.review_count})</span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Desde</p>
              <p className="text-xl font-extrabold text-slate-900 leading-none">
                {formatPrice(activity.price_from)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ persona</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#0066FF]/10 group-hover:bg-[#0066FF] flex items-center justify-center transition-colors duration-300">
              <ArrowRight className="w-4 h-4 text-[#0066FF] group-hover:text-white transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
