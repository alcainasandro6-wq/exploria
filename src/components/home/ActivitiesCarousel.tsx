'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { cn } from '@/lib/utils'
import type { ActivityListItem } from '@/lib/services/activities'

interface ActivitiesCarouselProps {
  activities: ActivityListItem[]
}

export function ActivitiesCarousel({ activities }: ActivitiesCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: false })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setScrollSnaps(emblaApi.scrollSnapList())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    // embla's own 'init' event already fired by the time this effect runs,
    // so read the initial state via a microtask instead of missing it.
    queueMicrotask(onSelect)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="relative">
      <div className="overflow-hidden -mx-1 px-1" ref={emblaRef}>
        <div className="flex gap-6">
          {activities.map((activity) => (
            <div key={activity.id} className="shrink-0 grow-0 basis-[85%] sm:basis-[46%] lg:basis-[30%]">
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>
      </div>

      {/* Right-edge fade hinting there's more to scroll */}
      <div
        className={cn(
          'hidden md:block absolute top-0 right-0 bottom-8 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none transition-opacity duration-300',
          canNext ? 'opacity-100' : 'opacity-0'
        )}
      />

      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canPrev}
        aria-label="Anterior"
        className="hidden md:flex absolute -left-5 top-28 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.14)] border border-slate-100 items-center justify-center text-slate-600 hover:text-white hover:bg-primary hover:border-primary transition-all duration-200 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canNext}
        aria-label="Siguiente"
        className="hidden md:flex absolute -right-5 top-28 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-[0_8px_24px_rgba(15,23,42,0.14)] border border-slate-100 items-center justify-center text-slate-600 hover:text-white hover:bg-primary hover:border-primary transition-all duration-200 hover:scale-105 disabled:opacity-0 disabled:pointer-events-none z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Scroll progress dots */}
      {scrollSnaps.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir al grupo ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === selectedIndex ? 'w-7 bg-primary' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
