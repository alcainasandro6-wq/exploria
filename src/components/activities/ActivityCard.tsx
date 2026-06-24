import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Clock, Star, Users, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDuration, getRatingLabel, cn } from '@/lib/utils'
import type { Activity } from '@/types/database'

interface ActivityCardProps {
  activity: Activity
  compact?: boolean
}

export function ActivityCard({ activity, compact = false }: ActivityCardProps) {
  const coverImage = activity.images?.find((img) => img.is_cover)?.url ||
    activity.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

  return (
    <Link href={`/activities/${activity.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className={cn('relative overflow-hidden', compact ? 'h-44' : 'h-52')}>
          <Image
            src={coverImage}
            alt={activity.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {activity.featured && (
              <Badge className="bg-[#0066FF] text-white text-xs px-2.5 py-1 rounded-lg border-0">
                Destacado
              </Badge>
            )}
            {activity.cancellation_policy?.toLowerCase().includes('gratuita') && (
              <Badge variant="success" className="text-xs px-2.5 py-1 rounded-lg">
                Cancelación gratis
              </Badge>
            )}
          </div>

          {/* Favorite */}
          <button
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-sm"
            onClick={(e) => e.preventDefault()}
            aria-label="Añadir a favoritos"
          >
            <Heart className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors" />
          </button>

          {/* Category */}
          {activity.category && (
            <div className="absolute bottom-3 left-3">
              <span className="text-xs bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                {activity.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Provider */}
          {activity.provider && (
            <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
              {activity.provider.company_name}
            </p>
          )}

          {/* Title */}
          <h3 className={cn(
            'font-bold text-slate-900 leading-tight mb-2 group-hover:text-[#0066FF] transition-colors line-clamp-2',
            compact ? 'text-sm' : 'text-base'
          )}>
            {activity.title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(activity.duration_minutes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>Máx. {activity.max_participants}</span>
            </div>
          </div>

          {/* Rating */}
          {activity.review_count > 0 && (
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3 h-3',
                      star <= Math.round(activity.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-200 fill-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700">{activity.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({activity.review_count})</span>
              <span className="text-xs text-slate-400">• {getRatingLabel(activity.rating)}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-slate-400">Desde</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">
                  {formatPrice(activity.price_from)}
                </span>
                <span className="text-xs text-slate-400">/ persona</span>
              </div>
            </div>
            <div className="text-xs text-[#0066FF] font-medium group-hover:underline">
              Ver detalles →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
