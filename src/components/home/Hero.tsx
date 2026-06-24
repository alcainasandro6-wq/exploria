'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Search, Star, ShieldCheck, Zap } from 'lucide-react'
import Image from 'next/image'

const POPULAR = ['Buceo', 'Kayak', 'Catamarán', 'Paddle surf', 'Gastronomía']

const TRUST = [
  { icon: Star, text: '4.9 valoración media', color: 'text-amber-400' },
  { icon: ShieldCheck, text: 'Cancelación gratuita', color: 'text-emerald-400' },
  { icon: Zap, text: '150+ actividades', color: 'text-sky-400' },
]

export function Hero() {
  const router = useRouter()
  const [search, setSearch] = useState('')
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(search.trim() ? `/activities?q=${encodeURIComponent(search)}` : '/activities')
  }

  return (
    <section>
      {/* Photo banner with parallax */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(480px, 72vh, 680px)' }}>

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

        {/* Gradient overlay — heaviest at bottom, subtle at top */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/80" />

        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-[100px] animate-orb-1" />
          <div className="absolute bottom-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-sky-400/6 blur-[80px] animate-orb-3" />
        </div>

        {/* Content — vertically centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6">

          {/* Trust badge */}
          <div className="flex items-center gap-2 bg-white/12 backdrop-blur-md border border-white/18 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">
              Cancelación gratuita disponible en la mayoría de actividades
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[clamp(2.8rem,8vw,5.5rem)] font-black text-white leading-none tracking-tighter mb-4">
            Torrevieja
          </h1>
          <p className="text-white/65 text-base md:text-xl font-light mb-10 max-w-lg">
            Descubre las mejores experiencias del Mediterráneo con proveedores locales verificados
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl mb-6">
            <div className="flex bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden p-1.5 gap-1.5">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="¿Qué quieres hacer en Torrevieja?"
                  className="flex-1 text-slate-800 placeholder:text-slate-400 outline-none text-sm bg-transparent py-3"
                />
              </div>
              <button
                type="submit"
                className="bg-[#1A56FF] hover:bg-[#0041CC] text-white font-bold px-7 py-3 rounded-xl text-sm transition-colors shrink-0"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Popular tags */}
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span className="text-white/35 text-[11px] uppercase tracking-widest">Tendencias:</span>
            {POPULAR.map((term) => (
              <button
                key={term}
                onClick={() => router.push(`/activities?q=${encodeURIComponent(term)}`)}
                className="text-xs text-white/75 bg-white/10 hover:bg-white/20 border border-white/12 hover:border-white/30 rounded-full px-4 py-1.5 transition-all backdrop-blur-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar below the photo — Civitatis style */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-8 gap-y-3 py-4">
            {TRUST.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${color}`} fill="currentColor" />
                <span className="text-sm font-medium text-slate-600">{text}</span>
              </div>
            ))}
            <div className="hidden sm:block w-px h-4 bg-slate-200" />
            <span className="text-sm text-slate-400">Torrevieja · Costa Blanca · España</span>
          </div>
        </div>
      </div>
    </section>
  )
}
