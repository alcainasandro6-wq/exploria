'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Search, MapPin, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
import { CITIES } from '@/lib/constants'

export function Hero() {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<string>(CITIES[0].slug)
  const [isCityOpen, setIsCityOpen] = useState(false)
  const bgRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setIsCityOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selectedCity = CITIES.find((c) => c.slug === city) ?? CITIES[0]

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    params.set('city', city)
    router.push(`/activities?${params.toString()}`)
  }

  return (
    <section>
      {/* Photo banner — pulled up under the transparent glass header so the image shows through it,
          full viewport height so the background media covers the entire first screen */}
      <div className="relative overflow-hidden -mt-20" style={{ height: '100dvh', minHeight: 640 }}>

        {/* Parallax background */}
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{ transformOrigin: 'center top', willChange: 'transform' }}
        >
          <Image
            src="/hero-background.jpg"
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
          <h2 className="text-[clamp(2.75rem,7vw,4.75rem)] font-bold text-white leading-[1.15] tracking-tight mb-7">
            Torrevieja
          </h2>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-7 w-full max-w-xs">
            <span className="h-px flex-1 bg-white/25" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 whitespace-nowrap">Costa Blanca</span>
            <span className="h-px flex-1 bg-white/25" />
          </div>

          {/* Heading */}
          <p className="text-[clamp(1.15rem,2.2vw,1.5rem)] font-bold text-white leading-[1.6] tracking-tight mb-5 max-w-2xl">
            {t('hero_title')}
          </p>

          <p className="text-white/70 text-[15px] mb-10 max-w-xl leading-[1.9]">
            {t.rich('hero_subtitle', { bold: (chunks) => <strong className="font-black text-white">{chunks}</strong> })}
          </p>

          {/* Search bar — pill shape */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-3xl sm:rounded-full shadow-2xl shadow-black/50 overflow-hidden sm:pl-2 sm:pr-1.5 sm:py-1.5 gap-0 sm:gap-1">
              <div ref={cityRef} className="relative border-b sm:border-b-0 sm:border-r border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCityOpen((v) => !v)}
                  className="flex items-center gap-2 px-5 sm:px-4 py-3 sm:py-2.5 w-full sm:w-auto rounded-full hover:bg-slate-50 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-slate-800 font-semibold text-sm whitespace-nowrap">{selectedCity.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isCityOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCityOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30">
                    <p className="px-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {tc('cities_available')}
                    </p>
                    {CITIES.map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        disabled={!c.enabled}
                        onClick={() => { setCity(c.slug); setIsCityOpen(false) }}
                        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                          !c.enabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : city === c.slug
                              ? 'text-primary font-semibold bg-primary/5'
                              : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {c.name}
                        </span>
                        {!c.enabled ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-400 rounded-full px-2 py-0.5 shrink-0">
                            {tc('coming_soon')}
                          </span>
                        ) : city === c.slug ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 px-5 sm:px-3 py-3 sm:py-0 flex-1">
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
      </div>
    </section>
  )
}
