'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Search, MapPin, Star, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Hero() {
  const t = useTranslations('home')
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/activities?q=${encodeURIComponent(search)}`)
    } else {
      router.push('/activities')
    }
  }

  const popularSearches = ['Buceo', 'Kayak', 'Barco', 'Tours', 'Paddle surf', 'Flamenco']

  return (
    <section className="relative overflow-hidden">
      {/* Background photo with overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
          alt="Playa de Torrevieja"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-[#0066FF]/85 to-blue-800/90" />
      </div>

      {/* Wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full block h-16 md:h-24"
        >
          <path d="M0 100L1440 100L1440 30C1200 100 960 10 720 50C480 100 240 10 0 30L0 100Z" fill="white" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-36 md:pt-28 md:pb-44">
        {/* Location badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-5 py-2 text-white text-sm font-medium mb-8">
          <MapPin className="w-4 h-4 text-yellow-300 shrink-0" />
          <span>Torrevieja, Alicante · España</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
          {t('hero_title')}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('hero_subtitle')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
          <div className="flex bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden p-2 gap-2">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('hero_search_placeholder')}
                className="flex-1 text-slate-800 placeholder:text-slate-400 outline-none text-base bg-transparent py-1"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0 rounded-xl">
              {t('hero_cta')}
            </Button>
          </div>
        </form>

        {/* Popular Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <span className="text-white/60 text-sm font-medium">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => router.push(`/activities?q=${encodeURIComponent(term)}`)}
              className="text-sm text-white bg-white/15 hover:bg-white/25 border border-white/20 hover:border-white/40 rounded-full px-4 py-1.5 transition-all"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-blue-100/90">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">+500 reseñas verificadas</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Proveedores verificados</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-300" />
            <span className="text-sm font-medium">Actividades locales auténticas</span>
          </div>
        </div>
      </div>
    </section>
  )
}
