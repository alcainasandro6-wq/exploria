'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Search, MapPin, Star, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const popularSearches = [
    'Buceo', 'Kayak', 'Barco', 'Tours', 'Paddle surf', 'Flamenco'
  ]

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF] via-[#0052CC] to-[#003d99]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L1440 80L1440 20C1200 80 960 0 720 40C480 80 240 0 0 20L0 80Z" fill="white" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
          <MapPin className="w-4 h-4" />
          <span>Torrevieja, Alicante</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 text-balance">
          {t('hero_title')}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          {t('hero_subtitle')}
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden p-2 gap-2">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('hero_search_placeholder')}
                className="flex-1 text-slate-800 placeholder:text-slate-400 outline-none text-base font-medium bg-transparent"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0 rounded-xl">
              {t('hero_cta')}
            </Button>
          </div>
        </form>

        {/* Popular Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-blue-200 text-sm">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => router.push(`/activities?q=${encodeURIComponent(term)}`)}
              className="text-sm text-white bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-blue-100">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium">+500 reseñas verificadas</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Proveedores verificados</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">Actividades locales auténticas</span>
          </div>
        </div>
      </div>
    </section>
  )
}
