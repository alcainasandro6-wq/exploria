'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import { LOCALE_NAMES, LOCALES } from '@/lib/constants'
import { useCurrency, type Currency } from '@/context/CurrencyContext'
import ReactCountryFlag from 'react-country-flag'
import type { Profile } from '@/types/database'

const LOCALE_TO_COUNTRY: Record<string, string> = {
  es: 'ES', en: 'GB', fr: 'FR', de: 'DE', pl: 'PL', ru: 'RU',
}

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
]

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const { currency, setCurrency, symbol } = useCurrency()

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(data)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const navLinks = [
    { href: '/activities', label: t('activities') },
    { href: '/categories', label: t('categories') },
    { href: '/blog', label: t('blog') },
    { href: '/about', label: t('about') },
  ]

  const getDashboardPath = () => {
    if (!user) return '/dashboard'
    switch (user.role) {
      case 'admin': return '/dashboard/admin'
      case 'provider': return '/dashboard/provider'
      case 'hotel': return '/dashboard/hotel'
      default: return '/dashboard/customer'
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span
              className="text-[22px] font-black tracking-[-0.06em] text-[#004aad]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              exploria
            </span>
            <span className="text-[22px] font-black text-[#1A56FF]" style={{ fontFamily: 'var(--font-display)' }}>.</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  pathname === link.href
                    ? 'text-[#1A56FF] bg-[#1A56FF]/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-1 shrink-0">

            {/* Currency */}
            <div className="relative">
              <button
                onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsLangOpen(false); setIsUserOpen(false) }}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                {symbol}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {isCurrencyOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setIsCurrencyOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2.5 transition-colors',
                        currency === c.code ? 'text-[#1A56FF] font-semibold' : 'text-slate-700'
                      )}
                    >
                      <span className="font-bold w-4">{c.symbol}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language */}
            <div className="relative">
              <button
                onClick={() => { setIsLangOpen(!isLangOpen); setIsCurrencyOpen(false); setIsUserOpen(false) }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[locale]} svg style={{ width: '1.15em', height: '1.15em' }} />
                <span className="uppercase font-medium text-xs">{locale}</span>
                <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', isLangOpen && 'rotate-180')} />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { router.replace(pathname, { locale: loc }); setIsLangOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors',
                        locale === loc ? 'text-[#1A56FF] font-medium' : 'text-slate-700'
                      )}
                    >
                      <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[loc]} svg style={{ width: '1.1em', height: '1.1em' }} />
                      {LOCALE_NAMES[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setIsUserOpen(!isUserOpen); setIsLangOpen(false); setIsCurrencyOpen(false) }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="text-xs bg-[#1A56FF] text-white">{getInitials(user.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700">{user.full_name?.split(' ')[0] || 'Usuario'}</span>
                  <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', isUserOpen && 'rotate-180')} />
                </button>
                {isUserOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                    <Link
                      href={getDashboardPath()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsUserOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      {t('dashboard')}
                    </Link>
                    <div className="border-t border-slate-100 my-1 mx-3" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-[#1A56FF] hover:bg-[#0041CC] rounded-lg transition-colors"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-slate-100 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  pathname === link.href ? 'text-[#1A56FF] bg-[#1A56FF]/5' : 'text-slate-700 hover:bg-slate-50'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 pb-2 space-y-2.5 px-1">
              <div className="flex gap-2">
                <select
                  value={locale}
                  onChange={(e) => { router.replace(pathname, { locale: e.target.value }); setIsMenuOpen(false) }}
                  className="flex-1 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none"
                >
                  {LOCALES.map((loc) => <option key={loc} value={loc}>{LOCALE_NAMES[loc]}</option>)}
                </select>
                <select
                  value={currency}
                  onChange={(e) => { setCurrency(e.target.value as Currency); setIsMenuOpen(false) }}
                  className="flex-1 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none"
                >
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.label}</option>)}
                </select>
              </div>
              {user ? (
                <>
                  <Link
                    href={getDashboardPath()}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false) }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="flex items-center justify-center w-full py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {t('login')}
                  </Link>
                  <Link href="/auth/register" className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-bold text-white bg-[#1A56FF] hover:bg-[#0041CC] transition-colors" onClick={() => setIsMenuOpen(false)}>
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
