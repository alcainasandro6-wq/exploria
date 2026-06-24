'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { Menu, X, ChevronDown, User, LayoutDashboard, LogOut } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser(data)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-md'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-slate-900">
              Exploria
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#0066FF]',
                  pathname === link.href ? 'text-[#0066FF]' : 'text-slate-600'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="relative">
              <button
                onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsLangOpen(false) }}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                <span>{symbol}</span>
                <span className="text-xs text-slate-400">{currency}</span>
              </button>
              {isCurrencyOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setIsCurrencyOpen(false) }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 flex items-center gap-2.5',
                        currency === c.code ? 'text-[#0066FF] font-semibold' : 'text-slate-700'
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
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[locale]} svg style={{ width: '1.2em', height: '1.2em' }} />
                <span className="uppercase font-medium">{locale}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        router.replace(pathname, { locale: loc })
                        setIsLangOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 flex items-center gap-2.5',
                        locale === loc ? 'text-[#0066FF] font-medium' : 'text-slate-700'
                      )}
                    >
                      <ReactCountryFlag countryCode={LOCALE_TO_COUNTRY[loc]} svg style={{ width: '1.2em', height: '1.2em' }} />
                      {LOCALE_NAMES[loc]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserOpen(!isUserOpen)}
                  className="flex items-center gap-2 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{getInitials(user.full_name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700">
                    {user.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                    <Link
                      href={getDashboardPath()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsUserOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/dashboard/customer"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setIsUserOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  {t('login')}
                </Link>
                <Link 
                  href="/auth/register"
                  className={cn(buttonVariants({ size: 'sm' }))}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-[#0066FF] hover:bg-slate-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 px-4">
              {user ? (
                <>
                  <Link 
                    href={getDashboardPath()}
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  <Button variant="ghost" className="w-full text-red-600" onClick={handleSignOut}>
                    {t('logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className={cn(buttonVariants(), 'w-full justify-center')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
