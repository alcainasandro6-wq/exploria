'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Playfair_Display } from 'next/font/google'
import { Search, MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import { CITIES } from '@/lib/constants'

const serif = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-hero-serif',
})

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

  return (
    <section className={serif.variable}>
      {/* Photo banner — pulled up under the transparent glass header so the image shows through it,
          full viewport height so the background media covers the entire first screen */}
      <div className="relative overflow-hidden -mt-20" style={{ height: '100dvh', minHeight: 640 }}>

        {/* Parallax background — softly blurred so the yacht already present in this photo
            reads as ambient texture, letting the sharp layered cutout below be the one clear boat */}
        <div
          ref={bgRef}
          className="absolute -inset-4"
          style={{ transformOrigin: 'center top', willChange: 'transform' }}
        >
          <Image
            src="/hero-background.jpg"
            alt="Textura del mar en la Costa Blanca"
            fill
            className="object-cover object-center blur-lg scale-110"
            priority
          />
        </div>

        {/* Gradient overlay — the source photo is already dark, keep this light */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/45" />

        {/* Extra scrim behind the transparent glass header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />

        {/* Main content — centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 pb-16">

          {/* Side info — location (left) and rating (right), hidden on small screens */}
          <div className="hidden md:flex items-center gap-2 absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 text-white/80">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap">
              Torrevieja, España
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 text-white/80">
            <Star className="w-4 h-4 shrink-0 fill-current" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap">
              4.8 valoración media
            </span>
          </div>

          {/* Headline with the yacht layered on top, tripalicante/regatta-style */}
          <div className="relative w-full max-w-3xl mb-10">
            <h1
              className="text-white leading-[1.25] tracking-tight text-[clamp(1.9rem,5vw,3.5rem)]"
              style={{ fontFamily: 'var(--font-hero-serif)' }}
            >
              <span className="font-bold">Descubre </span>
              <span className="font-medium italic">Torrevieja.</span>
              <br />
              <span className="font-bold">Actividades y experiencias</span>
              <br />
              <span className="font-bold">con </span>
              <span className="font-medium italic">proveedores verificados</span>
              <br />
              <span className="font-bold">y garantía total</span>
            </h1>

            {/* Layered yacht cutout — sits on top of the headline for a sense of depth */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[42%] sm:w-[32%] max-w-[340px] aspect-[16/9]">
                <Image
                  src="/hero-boat.png"
                  alt=""
                  fill
                  className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                  priority
                />
              </div>
            </div>
          </div>

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
      </div>
    </section>
  )
}
