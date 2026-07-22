import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProviderByProfileId } from '@/lib/services/providers'
import { getProviderReservations } from '@/lib/services/reservations'
import { formatDate } from '@/lib/utils'

export default async function ProviderCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const provider = await getProviderByProfileId(user.id)
  if (!provider) redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]
  const bookings = await getProviderReservations(provider.id, {
    status: ['pending', 'confirmed'],
    dateFrom: today,
  })

  const byDate = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    (acc[b.activity_date] ??= []).push(b)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  return (
    <DashboardLayout role="provider">
      <DashboardHeader title="Calendario" subtitle="Próximas actividades confirmadas y pendientes" />

      {dates.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-slate-400">No tienes actividades programadas próximamente.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">{formatDate(date)}</h2>
              <div className="space-y-2">
                {byDate[date]
                  .sort((a, b) => a.activity_time.localeCompare(b.activity_time))
                  .map((b) => (
                    <Card key={b.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-primary shrink-0 w-16">
                          <Clock className="w-3.5 h-3.5" />{b.activity_time.slice(0, 5)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{b.activity?.title}</p>
                          <p className="text-xs text-slate-500">{b.customer?.full_name} · <Users className="w-3 h-3 inline" /> {b.participants} personas</p>
                        </div>
                        <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'}>
                          {b.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
