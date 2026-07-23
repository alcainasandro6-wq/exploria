'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import { LOCALE_NAMES, LOCALES } from '@/lib/constants'
import ReactCountryFlag from 'react-country-flag'
import type { Profile } from '@/types/database'

const LOCALE_TO_COUNTRY: Record<string, string> = {
  es: 'ES', en: 'GB', fr: 'FR', de: 'DE', pl: 'PL', ru: 'RU',
}

export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isUserOpen, setIsUserOpen] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  const supabase = createClient()

  // Only the homepage has a full-bleed hero photo for the header to float over —
  // everywhere else there's nothing but white page content behind it.
  const isHome = pathname === '/'
  const transparent = isHome && !isScrolled && !isMenuOpen

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
    if (!isHome) return
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHome])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/activities', label: t('activities') },
    { href: '/categories', label: t('categories') },
    { href: '/providers', label: t('providers') },
    { href: '/blog', label: t('blog') },
    { href: '/contact', label: t('contact') },
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
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        transparent ? 'bg-transparent' : 'bg-white border-b border-slate-100 shadow-[0_1px_20px_rgba(15,23,42,0.06)]'
      )}
    >
      <div className="w-full px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-20 gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <span
              className={cn(
                'text-[28px] font-black tracking-[-0.06em] transition-colors',
                transparent ? 'text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]' : 'text-primary-dark'
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              bookactivities
            </span>
            <span
              className={cn(
                'text-[28px] font-black transition-colors',
                transparent ? 'text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]' : 'text-primary'
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              .
            </span>
          </Link>

          {/* Desktop nav links — floating pill capsule, active tab gets a white pill */}
          <div className="hidden lg:flex items-center flex-1 justify-center">
            <div
              className={cn(
                'flex items-center gap-0.5 rounded-full p-1 transition-colors',
                transparent
                  ? 'glass-sheen-bg backdrop-blur-md backdrop-saturate-150 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'bg-slate-100/80'
              )}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap',
                    pathname === link.href
                      ? 'bg-white text-primary shadow-sm'
                      : transparent
                        ? 'text-white/90 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0 ml-auto">

            {/* Language — rounded pill button */}
            <div className="relative">
              <button
                onClick={() => { setIsLangOpen(!isLangOpen); setIsUserOpen(false) }}
                className={cn(
                  'flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-full transition-colors font-semibold',
                  transparent
                    ? 'text-white glass-sheen-bg backdrop-blur-md border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'text-white bg-primary hover:bg-primary-dark'
                )}
              >
                <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[locale]} svg style={{ width: '1.1em', height: '1.1em' }} />
                <span className="uppercase text-xs">{locale}</span>
                <ChevronDown className={cn('w-3 h-3 text-white/80 transition-transform', isLangOpen && 'rotate-180')} />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => { router.replace(pathname, { locale: loc }); setIsLangOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors',
                        locale === loc ? 'text-[#005B8D] font-medium' : 'text-slate-700'
                      )}
                    >
                      <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[loc]} svg style={{ width: '1.1em', height: '1.1em' }} />
                      {LOCALE_NAMES[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={cn('w-px h-5 mx-1 transition-colors', transparent ? 'bg-white/25' : 'bg-slate-200')} />

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setIsUserOpen(!isUserOpen); setIsLangOpen(false) }}
                  className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors', transparent ? 'hover:bg-white/10' : 'hover:bg-slate-50')}
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="text-xs bg-[#005B8D] text-white">{getInitials(user.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className={cn('text-sm font-medium', transparent ? 'text-white' : 'text-slate-700')}>{user.full_name?.split(' ')[0] || 'Usuario'}</span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', transparent ? 'text-white/80' : 'text-slate-400', isUserOpen && 'rotate-180')} />
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
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    transparent
                      ? 'glass-sheen-text hover:brightness-125'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className={cn(
                    'px-4 py-2 text-sm font-bold rounded-full transition-colors shadow-sm',
                    transparent
                      ? 'glass-sheen-bg text-white backdrop-blur-md border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'text-white bg-[#005B8D] hover:bg-[#003654]'
                  )}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'lg:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
              transparent ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute left-0 right-0 top-full bg-white border-b border-slate-100 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  pathname === link.href ? 'text-[#005B8D] bg-[#005B8D]/5' : 'text-slate-700 hover:bg-slate-50'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 pb-2 space-y-2.5 px-1">
              <select
                value={locale}
                onChange={(e) => { router.replace(pathname, { locale: e.target.value }); setIsMenuOpen(false) }}
                className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none"
              >
                {LOCALES.map((loc) => <option key={loc} value={loc}>{LOCALE_NAMES[loc]}</option>)}
              </select>
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
                  <Link href="/auth/register" className="flex items-center justify-center w-full py-2.5 rounded-full text-sm font-bold text-white bg-[#005B8D] hover:bg-[#003654] transition-colors" onClick={() => setIsMenuOpen(false)}>
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
