'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/ui/reveal'
import type { PackWithActivities } from '@/lib/services/packs'

interface PacksSectionProps {
  packs: PackWithActivities[]
}

export function PacksSection({ packs }: PacksSectionProps) {
  const t = useTranslations('home')
  const trackRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const checkScroll = useCallback(() => {
    if (!trackRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    track.addEventListener('scroll', checkScroll)
    checkScroll()
    window.addEventListener('resize', checkScroll)

    return () => {
      track.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return
    const { clientWidth } = trackRef.current
    const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75
    trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  // Slow auto-advance — pauses while the user is hovering/interacting.
  useEffect(() => {
    if (isPaused || packs.length <= 1) return
    const id = setInterval(() => {
      const el = trackRef.current
      if (!el) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: el.clientWidth * 0.75, behavior: 'smooth' })
      }
    }, 4500)
    return () => clearInterval(id)
  }, [isPaused, packs.length])

  if (packs.length === 0) return null

  return (
    <section className="packs-section">
      <div className="packs-container">

        {/* Header */}
        <Reveal className="packs-header">
          <h2 className="packs-title">{t('packs_title')}</h2>
          <p className="packs-intro">
            {t.rich('packs_subtitle', { bold: (chunks) => <strong className="font-extrabold text-slate-900">{chunks}</strong> })}
          </p>
        </Reveal>

        {/* Carousel Container */}
        <Reveal className="relative group/carousel" delay={120}>
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center shadow-lg border border-slate-100 transition-all hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Previous pack"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Grid/Scrollable Row */}
          <div
            ref={trackRef}
            className="packs-grid-row scroll-smooth"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {packs.map((pack, index) => (
              <Link
                key={pack.id}
                href="/activities"
                className="packs-poster-card group"
              >
                <div className="packs-poster-wrapper">
                  {pack.image_url ? (
                    <Image
                      src={pack.image_url}
                      alt={pack.title}
                      fill
                      sizes="(max-width: 640px) 500px, (max-width: 1024px) 450px, 450px"
                      quality={95}
                      className="object-cover transition-transform duration-500 group-hover:scale-102"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                      <Package className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  <div className="packs-poster-overlay">
                    <span className="packs-poster-btn">
                      {t('packs_view_pack')} <ArrowRight className="packs-poster-icon" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center shadow-lg border border-slate-100 transition-all hover:scale-105 active:scale-95 duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Next pack"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </Reveal>

      </div>
    </section>
  )
}
