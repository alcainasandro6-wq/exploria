'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, ChevronRight, Clock, Users, Star, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'
import { Reveal } from '@/components/ui/reveal'
import type { ActivityListItem } from '@/lib/services/activities'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

function cover(activity: ActivityListItem) {
  return (
    activity.images?.find((img) => img.is_cover)?.url ||
    activity.images?.[0]?.url ||
    FALLBACK_IMAGE
  )
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

interface Props {
  activities: ActivityListItem[]
}

export function ActivitiesCarousel({ activities }: Props) {
  const t = useTranslations('home')
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const CARD_W = 292 // card width px (matches CSS)
  const GAP = 20      // gap px (matches CSS)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    updateArrows()
    return () => el.removeEventListener('scroll', updateArrows)
  }, [updateArrows])

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const step = (CARD_W + GAP) * 2
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  // Dot click: scroll to card index
  const scrollToIndex = (i: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * (CARD_W + GAP), behavior: 'smooth' })
    setActiveIndex(i)
  }

  // Update dot on scroll
  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    updateArrows()
    const idx = Math.round(el.scrollLeft / (CARD_W + GAP))
    setActiveIndex(idx)
  }, [updateArrows])

  // Slow auto-advance — pauses while the user is hovering/interacting.
  useEffect(() => {
    if (isPaused || activities.length <= 1) return
    const id = setInterval(() => {
      const el = trackRef.current
      if (!el) return
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + CARD_W + GAP, behavior: 'smooth' })
    }, 4500)
    return () => clearInterval(id)
  }, [isPaused, activities.length])

  if (activities.length === 0) return null

  return (
    <section className="carousel-section">
      <div className="carousel-container">

        {/* Header */}

        <Reveal className="carousel-header">
          <div>
            <p className="carousel-label">{t('featured_label')}</p>
            <h2 className="carousel-title">
              {t.rich('featured_title', { br: () => <br className="hidden sm:block" /> })}
            </h2>
          </div>
          <Link href="/activities" className="carousel-all-link group">
            {t('featured_view_all')}
            <ArrowRight className="carousel-all-icon" />
          </Link>
        </Reveal>
        <Reveal className="carousel-outer" delay={120}>
          {/* Prev arrow */}
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canPrev}
            aria-label={t('featured_prev')}
            className="carousel-arrow carousel-arrow--prev"
          >
            <ChevronLeft className="carousel-arrow-icon" />
          </button>

          {/* Scrollable track */}
          <div
            ref={trackRef}
            className="carousel-track"
            onScroll={onScroll}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/activities/${activity.slug}`}
                className="carousel-card group"
              >
                {/* Image */}
                <div className="carousel-card-img">
                  <Image
                    src={cover(activity)}
                    alt={activity.title}
                    fill
                    sizes="292px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {activity.featured && (
                    <span className="carousel-badge">{t('featured_badge')}</span>
                  )}
                </div>

                {/* Body */}
                <div className="carousel-card-body">
                  <h3 className="carousel-card-title">{activity.title}</h3>

                  <div className="carousel-card-meta">
                    <span className="carousel-meta-item">
                      <Clock className="carousel-meta-icon" />
                      {formatDuration(activity.duration_minutes)}
                    </span>
                    <span className="carousel-meta-item">
                      <Users className="carousel-meta-icon" />
                      {t('featured_max_people', { count: activity.max_participants })}
                    </span>
                    {activity.rating > 0 && (
                      <span className="carousel-meta-item carousel-meta-item--rating">
                        <Star className="carousel-meta-icon carousel-meta-icon--star" />
                        {activity.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="carousel-card-footer">
                    <div>
                      <span className="carousel-price-from">{t('featured_from')}</span>
                      <span className="carousel-price">{formatPrice(activity.price_from)}</span>
                    </div>
                    <span className="carousel-cta">
                      {t('featured_view_activity')} <ArrowRight className="carousel-cta-icon" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => scrollBy(1)}
            disabled={!canNext}
            aria-label={t('featured_next')}
            className="carousel-arrow carousel-arrow--next"
          >
            <ChevronRight className="carousel-arrow-icon" />
          </button>
        </Reveal>

        {/* Dots */}
        <div className="carousel-dots" role="tablist" aria-label="Actividades">
          {activities.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Actividad ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`carousel-dot ${i === activeIndex ? 'carousel-dot--active' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
