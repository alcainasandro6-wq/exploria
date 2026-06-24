import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { SubscriptionBanner } from '@/components/dashboard/provider/SubscriptionBanner'
import { Eye, Star, Calendar, PlusCircle, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const MOCK_SUBSCRIPTION = {
  plan: 'Pro',
  status: 'active' as const,
  nextBilling: '2025-08-01',
  price: 99,
}

const MOCK_ACTIVITIES = [
  { id: 'a1', title: 'Buceo con instructores certificados', status: 'published', bookings: 42, rating: 4.9, views: 1240, price: 45, category: 'Buceo y snorkel', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=60' },
  { id: 'a2', title: 'Tour snorkel avanzado', status: 'published', bookings: 28, rating: 4.7, views: 890, price: 35, category: 'Buceo y snorkel', image: 'https://images.unsplash.com/photo-1560881882-8ffcdb24bbe0?w=200&q=60' },
  { id: 'a3', title: 'Curso de buceo PADI Open Water', status: 'draft', bookings: 0, rating: 0, views: 0, price: 299, category: 'Buceo y snorkel', image: null },
]

const statusColors: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-slate-100 text-slate-600',
  suspended: 'bg-red-100 text-red-700',
  archived: 'bg-slate-100 text-slate-500',
}

const statusLabels: Record<string, string> = {
  published: 'Publicada',
  draft: 'Borrador',
  suspended: 'Suspendida',
  archived: 'Archivada',
}

export default function ProviderActivitiesPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar role="provider" userName="Buceo Mediterráneo" userEmail="info@buceomed.es" />
      <main className="flex-1 p-8 overflow-auto">
        <SubscriptionBanner subscription={MOCK_SUBSCRIPTION} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis actividades</h1>
            <p className="text-slate-500 text-sm mt-1">{MOCK_ACTIVITIES.length} actividades · Plan Pro (máx. 20)</p>
          </div>
          <Link href="/dashboard/provider/activities/new" className={cn(buttonVariants(), 'gap-2')}>
            <PlusCircle className="w-4 h-4" />
            Nueva actividad
          </Link>
        </div>

        <div className="space-y-4">
          {MOCK_ACTIVITIES.map((activity) => (
            <div key={activity.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-5">
              {/* Thumbnail */}
              <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {activity.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl">🤿</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', statusColors[activity.status])}>
                    {statusLabels[activity.status]}
                  </span>
                  <span className="text-xs text-slate-400">{activity.category}</span>
                </div>
                <h3 className="font-semibold text-slate-900 truncate">{activity.title}</h3>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{activity.price}€/persona</span>
                  {activity.status === 'published' && (
                    <>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{activity.views} vistas</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{activity.bookings} reservas</span>
                      {activity.rating > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{activity.rating}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/provider/activities/${activity.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </Link>
                {activity.status === 'published' && (
                  <Link href={`/activities/${activity.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
