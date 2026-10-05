'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { LOCALE_NAMES, LOCALES } from '@/lib/constants'
import ReactCountryFlag from 'react-country-flag'
import {
  LayoutDashboard, Calendar, Star, Heart, MessageSquare, Settings,
  BarChart3, Building2, QrCode, Link2, TrendingUp,
  Package, DollarSign, Users, CreditCard, Boxes,
  Newspaper, Sliders, Activity, Gift, LogOut, ChevronDown, ArrowLeft, AlertTriangle, Wallet, UserPlus
} from 'lucide-react'
import type { UserRole } from '@/types/database'

const LOCALE_TO_COUNTRY: Record<string, string> = {
  es: 'ES', en: 'GB', fr: 'FR', de: 'DE', pl: 'PL', ru: 'RU',
}

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

type NavTranslate = (key: string) => string

const getNavItems = (
  role: UserRole,
  t: NavTranslate,
  tProvider: NavTranslate,
  tHotel: NavTranslate,
  tAdmin: NavTranslate
): SidebarItem[] => {
  switch (role) {
    case 'customer':
      return [
        { href: '/dashboard/customer', label: t('home'), icon: LayoutDashboard },
        { href: '/dashboard/customer/bookings', label: t('bookings'), icon: Calendar },
        { href: '/dashboard/customer/favorites', label: t('favorites'), icon: Heart },
        { href: '/dashboard/customer/loyalty', label: t('loyalty'), icon: Gift },
        { href: '/dashboard/customer/providers', label: t('providers'), icon: Building2 },
        { href: '/dashboard/customer/reviews', label: t('reviews'), icon: Star },
        { href: '/dashboard/customer/messages', label: t('messages'), icon: MessageSquare },
        { href: '/dashboard/customer/settings', label: t('my_account'), icon: Settings },
      ]
    case 'hotel':
      return [
        { href: '/dashboard/hotel', label: t('home'), icon: LayoutDashboard },
        { href: '/dashboard/hotel/stats', label: tHotel('stats'), icon: BarChart3 },
        { href: '/dashboard/hotel/bookings', label: tHotel('bookings'), icon: Calendar },
        { href: '/dashboard/hotel/commissions', label: tHotel('commissions'), icon: DollarSign },
        { href: '/dashboard/hotel/qr', label: tHotel('qr'), icon: QrCode },
        { href: '/dashboard/hotel/affiliate', label: tHotel('affiliate'), icon: Link2 },
        { href: '/dashboard/hotel/settings', label: t('settings'), icon: Settings },
      ]
    case 'provider':
      return [
        { href: '/dashboard/provider', label: t('home'), icon: LayoutDashboard },
        { href: '/dashboard/provider/subscription', label: tProvider('subscription'), icon: CreditCard },
        { href: '/dashboard/provider/activities', label: tProvider('activities'), icon: Package },
        { href: '/dashboard/provider/bookings', label: tProvider('bookings'), icon: Calendar },
        { href: '/dashboard/provider/calendar', label: tProvider('calendar'), icon: Calendar },
        { href: '/dashboard/provider/stats', label: tProvider('stats'), icon: BarChart3 },
        { href: '/dashboard/provider/commissions', label: tProvider('commissions'), icon: DollarSign },
        { href: '/dashboard/provider/settings', label: t('settings'), icon: Settings },
      ]
    case 'admin':
      return [
        { href: '/dashboard/admin', label: tAdmin('overview'), icon: LayoutDashboard },
        { href: '/dashboard/admin/reservations', label: tAdmin('reservations'), icon: Calendar },
        { href: '/dashboard/admin/incidents', label: tAdmin('incidents'), icon: AlertTriangle },
        { href: '/dashboard/admin/activities', label: tAdmin('activities'), icon: Activity },
        { href: '/dashboard/admin/users', label: tAdmin('users'), icon: Users },
        { href: '/dashboard/admin/providers', label: tAdmin('providers'), icon: Building2 },
        { href: '/dashboard/admin/provider-applications', label: tAdmin('provider_applications'), icon: UserPlus },
        { href: '/dashboard/admin/hotels', label: tAdmin('hotels'), icon: Building2 },
        { href: '/dashboard/admin/subscriptions', label: tAdmin('subscriptions'), icon: CreditCard },
        { href: '/dashboard/admin/commissions', label: tAdmin('commissions'), icon: DollarSign },
        { href: '/dashboard/admin/settlements', label: tAdmin('settlements'), icon: Wallet },
        { href: '/dashboard/admin/packs', label: tAdmin('packs'), icon: Boxes },
        { href: '/dashboard/admin/coupons', label: tAdmin('coupons'), icon: Gift },
        { href: '/dashboard/admin/analytics', label: tAdmin('analytics'), icon: TrendingUp },
        { href: '/dashboard/admin/cms', label: tAdmin('cms'), icon: Newspaper },
        { href: '/dashboard/admin/settings', label: tAdmin('settings_nav'), icon: Sliders },
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
  /** Mobile/tablet off-canvas mode: rendered as a slide-in drawer instead of a static column. */
  open?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ role, userName, userEmail, avatarUrl, open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const tProvider = useTranslations('provider_dashboard')
  const tHotel = useTranslations('hotel_dashboard')
  const tAdmin = useTranslations('admin_dashboard')
  const navItems = getNavItems(role, t, tProvider, tHotel, tAdmin)
  const [isLangOpen, setIsLangOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const roleLabels: Record<UserRole, string> = {
    customer: t('role_customer'),
    hotel: t('role_hotel'),
    provider: t('role_provider'),
    admin: t('role_admin'),
  }

  const roleColors: Record<UserRole, string> = {
    customer: 'bg-blue-100 text-blue-700',
    hotel: 'bg-purple-100 text-purple-700',
    provider: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-red-100 text-red-700',
  }

  const isOffCanvas = open !== undefined

  return (
    <>
      {isOffCanvas && (
        <div
          className={cn(
            'fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'w-72 sm:w-64 bg-white border-r border-slate-100 h-dvh flex flex-col shrink-0',
          isOffCanvas && [
            'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:self-start lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          ]
        )}
      >
        {/* User Profile */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shrink-0">
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
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center',
                    isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-100 space-y-0.5">
          <div className="relative">
            <button
              onClick={() => setIsLangOpen((v) => !v)}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[locale]} svg style={{ width: '1.1em', height: '1.1em' }} />
              <span className="flex-1 text-left">{LOCALE_NAMES[locale]}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', isLangOpen && 'rotate-180')} />
            </button>
            {isLangOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 max-h-64 overflow-y-auto">
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => { router.replace(pathname, { locale: loc }); setIsLangOpen(false) }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors',
                      locale === loc ? 'text-primary font-medium' : 'text-slate-700'
                    )}
                  >
                    <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[loc]} svg style={{ width: '1.1em', height: '1.1em' }} />
                    {LOCALE_NAMES[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            {t('back_to_site')}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
