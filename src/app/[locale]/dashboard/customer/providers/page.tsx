import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, BadgeCheck, MapPin, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProvidersDirectory } from '@/lib/services/customer'

export default async function CustomerProvidersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const providers = await getProvidersDirectory()

  return (
    <DashboardLayout role="customer">
      <DashboardHeader title="Proveedores" subtitle="Empresas verificadas que ofrecen actividades en BookActivities" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                {provider.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.logo_url} alt={provider.company_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-900 truncate">{provider.company_name}</p>
                  {provider.is_verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                </div>
                {provider.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{provider.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{provider.city}</span>
                  {provider.website && (
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                      <Globe className="w-3 h-3" />Web
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  )
}
