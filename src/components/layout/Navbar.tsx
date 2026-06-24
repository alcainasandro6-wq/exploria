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
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const { currency, setCurrency, symbol } = useCurrency()

  const supabase = createClient()
  const isAtTop = !isScrolled && pathname === '/'

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeAll = () => {
    setIsLangOpen(false)
    setIsCurrencyOpen(false)
    setIsUserOpen(false)
  }

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

  const dropdownClass = 'absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100/80 py-2 z-50'

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isAtTop
          ? 'bg-transparent border-b border-transparent'
          : 'bg-white/80 backdrop-blur-2xl border-b border-white/50 shadow-[0_1px_30px_rgba(0,0,0,0.06)]'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'flex items-center justify-between transition-all duration-500',
          isAtTop ? 'h-20' : 'h-16'
        )}>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/logo.svg"
              alt="Exploria"
              width={108}
              height={29}
              style={{
                filter: isAtTop ? 'brightness(0) invert(1)' : 'none',
                transition: 'filter 0.5s ease',
              }}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300',
                  isAtTop
                    ? cn(
                        'hover:bg-white/10',
                        pathname === link.href ? 'text-white' : 'text-white/65 hover:text-white'
                      )
                    : cn(
                        'hover:bg-slate-50',
                        pathname === link.href ? 'text-[#1A56FF]' : 'text-slate-600 hover:text-slate-900'
                      )
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className={cn(
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    isAtTop ? 'bg-white' : 'bg-[#1A56FF]'
                  )} />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-1.5">

            {/* Currency Switcher */}
            <div className="relative">
              <button
                onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsLangOpen(false); setIsUserOpen(false) }}
                className={cn(
                  'flex items-center gap-1.5 text-sm px-3 py-2 rounded-full transition-all duration-300 font-semibold',
                  isAtTop
                    ? 'text-white/65 hover:text-white hover:bg-white/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <span>{symbol}</span>
                <span className={cn('text-xs font-normal', isAtTop ? 'text-white/40' : 'text-slate-400')}>{currency}</span>
              </button>
              {isCurrencyOpen && (
                <div className={cn(dropdownClass, 'w-44')}>
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setIsCurrencyOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 flex items-center gap-3',
                        currency === c.code ? 'text-[#1A56FF] font-semibold' : 'text-slate-700'
                      )}
                    >
                      <span className="font-bold w-5">{c.symbol}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => { setIsLangOpen(!isLangOpen); setIsCurrencyOpen(false); setIsUserOpen(false) }}
                className={cn(
                  'flex items-center gap-1.5 text-sm px-3 py-2 rounded-full transition-all duration-300',
                  isAtTop
                    ? 'text-white/65 hover:text-white hover:bg-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[locale]} svg style={{ width: '1.1em', height: '1.1em' }} />
                <span className="uppercase font-medium text-xs">{locale}</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', isLangOpen && 'rotate-180')} />
              </button>
              {isLangOpen && (
                <div className={cn(dropdownClass, 'w-48')}>
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { router.replace(pathname, { locale: loc }); setIsLangOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 flex items-center gap-3',
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

            {/* Divider */}
            <div className={cn('w-px h-5 mx-1 transition-colors duration-500', isAtTop ? 'bg-white/15' : 'bg-slate-200')} />

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setIsUserOpen(!isUserOpen); closeAll(); setIsUserOpen(v => !v) }}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-300',
                    isAtTop ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                  )}
                >
                  <Avatar className="w-7 h-7 ring-1 ring-white/20">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="text-xs bg-[#1A56FF] text-white">{getInitials(user.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className={cn('text-sm font-medium', isAtTop ? 'text-white/80' : 'text-slate-700')}>
                    {user.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', isAtTop ? 'text-white/40' : 'text-slate-400', isUserOpen && 'rotate-180')} />
                </button>
                {isUserOpen && (
                  <div className={cn(dropdownClass, 'w-52')}>
                    <Link
                      href={getDashboardPath()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsUserOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      {t('dashboard')}
                    </Link>
                    <div className="border-t border-slate-100 my-1 mx-3" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
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
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300',
                    isAtTop
                      ? 'text-white/75 hover:text-white hover:bg-white/10'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className={cn(
                    'px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 shadow-sm',
                    isAtTop
                      ? 'bg-white text-[#004aad] hover:bg-white/90 shadow-white/20'
                      : 'bg-[#1A56FF] text-white hover:bg-[#0041CC]'
                  )}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'md:hidden w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300',
              isAtTop ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            )}
            aria-label="Menú"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — full-width dark glass panel dropping from navbar */}
      {isMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full bg-[#070D1F]/97 backdrop-blur-2xl border-b border-white/8 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all',
                  pathname === link.href
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 pb-1 border-t border-white/8 space-y-3 px-1">
              {/* Language + Currency row */}
              <div className="flex gap-2">
                <select
                  value={locale}
                  onChange={(e) => { router.replace(pathname, { locale: e.target.value }); setIsMenuOpen(false) }}
                  className="flex-1 bg-white/8 text-white text-sm rounded-xl px-3 py-2.5 border border-white/12 outline-none"
                >
                  {LOCALES.map((loc) => (
                    <option key={loc} value={loc} className="bg-[#070D1F]">{LOCALE_NAMES[loc]}</option>
                  ))}
                </select>
                <select
                  value={currency}
                  onChange={(e) => { setCurrency(e.target.value as Currency); setIsMenuOpen(false) }}
                  className="flex-1 bg-white/8 text-white text-sm rounded-xl px-3 py-2.5 border border-white/12 outline-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#070D1F]">{c.symbol} {c.label}</option>
                  ))}
                </select>
              </div>

              {user ? (
                <>
                  <Link
                    href={getDashboardPath()}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white border border-white/15 hover:bg-white/8 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false) }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/8 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold text-white/80 border border-white/15 hover:bg-white/8 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold text-[#004aad] bg-white hover:bg-white/90 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
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
