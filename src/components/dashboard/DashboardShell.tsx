'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden sticky top-20 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-50"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900">Panel</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  )
}
