import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCustomerMessages } from '@/lib/services/customer'
import { formatDate, cn } from '@/lib/utils'

export default async function CustomerMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const messages = await getCustomerMessages(user.id)

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Mensajes" subtitle="Conversaciones con proveedores sobre tus reservas" />

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 text-slate-300" />
            No tienes mensajes todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isSent = msg.from_id === user.id
            return (
              <Card key={msg.id} className={cn(!msg.is_read && !isSent && 'border-primary/40 bg-primary/5')}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', isSent ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary')}>
                    {isSent ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 truncate">{msg.subject}</p>
                      <span className="text-xs text-slate-400 shrink-0">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{msg.body}</p>
                    <p className="text-xs text-slate-400 mt-1">{isSent ? 'Enviado' : 'Recibido'}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
