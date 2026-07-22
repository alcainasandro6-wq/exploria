'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Search, Star, ShieldCheck, Zap, Users, MapPin } from 'lucide-react'
import Image from 'next/image'
import { CITIES } from '@/lib/constants'

export function Hero() {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<string>(CITIES[0].slug)
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    params.set('city', city)
    router.push(`/activities?${params.toString()}`)
  }

  const stats = [
    { icon: Star,        key: 'hero_stat_best',         color: 'text-amber-400' },
    { icon: ShieldCheck, key: 'hero_stat_cancellation',  color: 'text-emerald-400' },
    { icon: Users,       key: 'hero_stat_support',       color: 'text-sky-400' },
    { icon: Zap,         key: 'hero_stat_price',         color: 'text-violet-400' },
  ] as const

  return (
    <section>
      {/* Photo banner — pulled up under the transparent glass header so the image shows through it */}
      <div className="relative overflow-hidden -mt-20" style={{ height: 'clamp(560px, 76vh, 720px)' }}>

        {/* Parallax background */}
        <div
          ref={bgRef}
          className="absolute inset-0 scale-[1.18]"
          style={{ transformOrigin: 'center top', willChange: 'transform' }}
        >
          <Image
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
            alt="Costa de Torrevieja"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Gradient overlay — lighter than before, closer to an editorial photo caption than a dramatic poster */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/70" />

        {/* Extra scrim behind the transparent glass header — keeps white nav text legible
            regardless of how light the photo is at the very top (e.g. pale sky). */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />

        {/* Main content — centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 pb-16">

          {/* Overline + place name, tripalicante-style */}
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/70 mb-3">
            Descubre
          </span>
          <h2 className="text-[clamp(2.75rem,7vw,4.75rem)] font-black text-white leading-[0.95] tracking-tight mb-4">
            Torrevieja
          </h2>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5 w-full max-w-xs">
            <span className="h-px flex-1 bg-white/25" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 whitespace-nowrap">Costa Blanca</span>
            <span className="h-px flex-1 bg-white/25" />
          </div>

          {/* Heading */}
          <p className="text-[clamp(1.15rem,2.2vw,1.5rem)] font-bold text-white leading-tight tracking-tight mb-3 max-w-2xl">
            {t('hero_title')}
          </p>

          <p className="text-white/70 text-base md:text-lg mb-8 max-w-xl leading-relaxed">
            {t('hero_subtitle')}
          </p>

          {/* Search bar — pill shape */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-3xl sm:rounded-full shadow-2xl shadow-black/50 overflow-hidden sm:pl-6 sm:pr-1.5 sm:py-1.5 gap-0 sm:gap-3">
              <div className="flex items-center gap-2 px-5 sm:px-0 py-3 sm:py-0 border-b sm:border-b-0 sm:border-r border-slate-100 sm:pr-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-slate-700 font-semibold outline-none text-sm bg-transparent cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c.slug} value={c.slug} disabled={!c.enabled}>
                      {c.name}{!c.enabled ? ' (próximamente)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 px-5 sm:px-0 py-3 sm:py-0 flex-1">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('hero_search_placeholder')}
                  className="flex-1 text-slate-800 placeholder:text-slate-400 outline-none text-base bg-transparent sm:py-3"
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 sm:rounded-full text-[15px] transition-colors shrink-0 whitespace-nowrap"
              >
                {tc('search')} →
              </button>
            </div>
          </form>
        </div>

        {/* Stats — inside the image, bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:divide-x sm:divide-white/20 sm:flex-nowrap">
              {stats.map(({ icon: Icon, key, color }) => (
                <div key={key} className="flex items-center gap-2.5 sm:px-8 first:pl-0 last:pr-0">
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${color}`} />
                  <span className="text-[14px] font-semibold text-white whitespace-nowrap">
                    {t(key)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
