'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, Calendar, Star, Heart, MessageSquare, Settings,
  User, BarChart3, Building2, QrCode, Link2, TrendingUp,
  Package, PlusCircle, DollarSign, Users, FileText, CreditCard,
  ShieldCheck, Newspaper, Sliders, Activity
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const getNavItems = (role: UserRole): SidebarItem[] => {
  switch (role) {
    case 'customer':
      return [
        { href: '/dashboard/customer', label: 'Inicio', icon: LayoutDashboard },
        { href: '/dashboard/customer/bookings', label: 'Mis reservas', icon: Calendar },
        { href: '/dashboard/customer/favorites', label: 'Favoritos', icon: Heart },
        { href: '/dashboard/customer/reviews', label: 'Mis valoraciones', icon: Star },
        { href: '/dashboard/customer/messages', label: 'Mensajes', icon: MessageSquare, badge: '2' },
        { href: '/dashboard/customer/settings', label: 'Configuración', icon: Settings },
      ]
    case 'hotel':
      return [
        { href: '/dashboard/hotel', label: 'Inicio', icon: LayoutDashboard },
        { href: '/dashboard/hotel/stats', label: 'Estadísticas', icon: BarChart3 },
        { href: '/dashboard/hotel/bookings', label: 'Reservas', icon: Calendar },
        { href: '/dashboard/hotel/commissions', label: 'Comisiones', icon: DollarSign },
        { href: '/dashboard/hotel/qr', label: 'Mi QR', icon: QrCode },
        { href: '/dashboard/hotel/affiliate', label: 'Enlace afiliado', icon: Link2 },
        { href: '/dashboard/hotel/settings', label: 'Configuración', icon: Settings },
      ]
    case 'provider':
      return [
        { href: '/dashboard/provider', label: 'Inicio', icon: LayoutDashboard },
        { href: '/dashboard/provider/subscription', label: 'Suscripción', icon: CreditCard },
        { href: '/dashboard/provider/activities', label: 'Mis actividades', icon: Package },
        { href: '/dashboard/provider/activities/new', label: 'Nueva actividad', icon: PlusCircle },
        { href: '/dashboard/provider/bookings', label: 'Reservas', icon: Calendar },
        { href: '/dashboard/provider/calendar', label: 'Calendario', icon: Calendar },
        { href: '/dashboard/provider/stats', label: 'Estadísticas', icon: BarChart3 },
        { href: '/dashboard/provider/commissions', label: 'Comisiones', icon: DollarSign },
        { href: '/dashboard/provider/settings', label: 'Configuración', icon: Settings },
      ]
    case 'admin':
      return [
        { href: '/dashboard/admin', label: 'Resumen', icon: LayoutDashboard },
        { href: '/dashboard/admin/users', label: 'Usuarios', icon: Users },
        { href: '/dashboard/admin/providers', label: 'Proveedores', icon: Building2 },
        { href: '/dashboard/admin/hotels', label: 'Hoteles', icon: Building2 },
        { href: '/dashboard/admin/activities', label: 'Actividades', icon: Activity },
        { href: '/dashboard/admin/subscriptions', label: 'Suscripciones', icon: CreditCard },
        { href: '/dashboard/admin/commissions', label: 'Comisiones', icon: DollarSign },
        { href: '/dashboard/admin/cms', label: 'Blog / CMS', icon: Newspaper },
        { href: '/dashboard/admin/settings', label: 'Ajustes', icon: Sliders },
      ]
    default:
      return []
  }
}

interface DashboardSidebarProps {
  role: UserRole
  userName?: string
  userEmail?: string
  avatarUrl?: string
}

export function DashboardSidebar({ role, userName, userEmail, avatarUrl }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItems(role)

  const roleLabels: Record<UserRole, string> = {
    customer: 'Cliente',
    hotel: 'Hotel',
    provider: 'Proveedor',
    admin: 'Administrador',
  }

  const roleColors: Record<UserRole, string> = {
    customer: 'bg-blue-100 text-blue-700',
    hotel: 'bg-purple-100 text-purple-700',
    provider: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-red-100 text-red-700',
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-100 min-h-screen flex flex-col">
      {/* User Profile */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white font-bold">
            {userName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{userName || 'Usuario'}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <div className="mt-3">
          <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', roleColors[role])}>
            {roleLabels[role]}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-[#0066FF]/10 text-[#0066FF]'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Activity className="w-4.5 h-4.5" />
          Ver marketplace
        </Link>
      </div>
    </aside>
  )
}
