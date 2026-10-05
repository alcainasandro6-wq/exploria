'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Menu, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import type { UserRole } from '@/types/database'

interface DashboardShellProps {
  role: UserRole
  userName?: string
  userEmail?: string
  avatarUrl?: string
  children: React.ReactNode
}

export function DashboardShell({ role, userName, userEmail, avatarUrl, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const t = useTranslations('dashboard')

  return (
    <div className="dashboard-shell flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-50"
            aria-label={t('open_menu')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900 flex-1">{t('panel_label')}</span>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('back_to_site')}
          </Link>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
