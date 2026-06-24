'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Search, Star, ShieldCheck, MapPin } from 'lucide-react'
import Image from 'next/image'

const POPULAR = ['Buceo', 'Kayak', 'Catamarán', 'Paddle surf', 'Gastronomía']

export function Hero() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(search.trim() ? `/activities?q=${encodeURIComponent(search)}` : '/activities')
  }

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">

      {/* Full-bleed photo */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
          alt="Costa de Torrevieja"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Left-heavy gradient — shows photo on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070D1F]/95 via-[#070D1F]/65 to-[#070D1F]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070D1F]/70 via-transparent to-transparent" />
      </div>

      {/* Content — left-aligned, editorial */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 md:pb-36 pt-36">
        <div className="max-w-2xl lg:max-w-3xl">

          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40 mb-6">
            Costa Blanca · Torrevieja · España
          </p>

          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[90px] font-black text-white leading-[0.9] tracking-tighter mb-8">
            Vive el<br />
            <span className="text-[#4D9EFF]">Mediterráneo</span><br />
            como nunca
          </h1>

          <p className="text-white/60 text-base md:text-lg mb-10 max-w-md leading-relaxed">
            Más de 150 actividades con proveedores locales verificados en la Costa Blanca.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-xl mb-8">
            <div className="flex bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden p-1.5 gap-1.5">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buceo, kayak, barco, gastronomía..."
                  className="flex-1 text-slate-800 placeholder:text-slate-400 outline-none text-sm bg-transparent py-2.5"
                />
              </div>
              <button
                type="submit"
                className="bg-[#1A56FF] hover:bg-[#0041CC] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Popular tags */}
          <div className="flex flex-wrap items-center gap-2 mb-14">
            <span className="text-white/35 text-[11px] uppercase tracking-[0.2em] mr-1">Popular:</span>
            {POPULAR.map((term) => (
              <button
                key={term}
                onClick={() => router.push(`/activities?q=${encodeURIComponent(term)}`)}
                className="text-xs text-white/75 bg-white/8 hover:bg-white/18 border border-white/12 hover:border-white/30 rounded-full px-4 py-1.5 transition-all backdrop-blur-sm"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center gap-6 text-white/50">
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>+500 reseñas verificadas</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/15" />
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Proveedores verificados</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/15" />
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Experiencias locales auténticas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 md:h-20 block">
          <path d="M0 80L1440 80L1440 25C1200 80 960 5 720 40C480 80 240 5 0 25L0 80Z" fill="white" />
        </svg>
      </div>
    </section>
  )
}
