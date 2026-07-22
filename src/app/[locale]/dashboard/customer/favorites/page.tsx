import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getCustomerFavorites } from '@/lib/services/customer'
import { ActivityCard } from '@/components/activities/ActivityCard'
import type { Activity } from '@/types/database'

export default async function CustomerFavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const favorites = await getCustomerFavorites(user.id)

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Mis favoritos" subtitle={`${favorites.length} actividades guardadas`} />

      {favorites.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">Todavía no has guardado ninguna actividad.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => fav.activity && (
            <ActivityCard key={fav.id} activity={fav.activity as unknown as Activity} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
