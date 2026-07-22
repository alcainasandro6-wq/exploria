import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import type { UserRole } from '@/types/database'

interface DashboardLayoutProps {
  role: UserRole
  children: React.ReactNode
}

// Shared dashboard shell — fetches the real signed-in profile once so pages
// don't each hardcode mock name/email/avatar props for DashboardSidebar.
export async function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userName: string | undefined
  let userEmail: string | undefined
  let avatarUrl: string | undefined

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name || undefined
    userEmail = profile?.email || user.email || undefined
    avatarUrl = profile?.avatar_url || undefined
  }

  return (
    <DashboardShell role={role} userName={userName} userEmail={userEmail} avatarUrl={avatarUrl}>
      {children}
    </DashboardShell>
  )
}
