import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCustomerReviews, getReviewableBookings } from '@/lib/services/customer'
import { ReviewForm } from '@/components/dashboard/customer/ReviewForm'
import { formatDate } from '@/lib/utils'

export default async function CustomerReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [reviews, reviewable] = await Promise.all([
    getCustomerReviews(user.id),
    getReviewableBookings(user.id),
  ])

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Mis valoraciones" subtitle="Comparte tu experiencia con otros viajeros" />

      {reviewable.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Actividades pendientes de valorar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {reviewable.map((r) => (
              <ReviewForm key={r.id} reservationId={r.id} activityId={r.activity_id} activityTitle={r.activity?.title ?? ''} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Valoraciones enviadas</CardTitle></CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Todavía no has dejado ninguna valoración.</p>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-slate-900">{review.activity?.title}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-slate-600">{review.comment}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDate(review.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
