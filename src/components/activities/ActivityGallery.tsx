'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { X, ChevronLeft, ChevronRight, Images, PlayCircle } from 'lucide-react'
import type { ActivityImage } from '@/types/database'

interface ActivityGalleryProps {
  images: ActivityImage[]
  title: string
  videoUrl?: string | null
}

export function ActivityGallery({ images, title, videoUrl }: ActivityGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, loop: true })

  const sorted = [...images].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) || a.sort_order - b.sort_order)
  const cover = sorted[0]
  const rest = sorted.slice(1, 5)

  const openAt = (idx: number) => {
    setStartIndex(idx)
    setLightboxOpen(true)
  }

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(startIndex, true)
  }, [emblaApi, startIndex, lightboxOpen])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') scrollPrev()
      if (e.key === 'ArrowRight') scrollNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, scrollPrev, scrollNext])

  if (!cover) {
    return <div className="h-64 sm:h-80 md:h-96 rounded-2xl bg-slate-100 mb-8" />
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2 rounded-2xl overflow-hidden mb-8 h-72 sm:h-80 md:h-96">
        <button
          onClick={() => openAt(0)}
          className="col-span-2 row-span-2 relative group"
        >
          <Image src={cover.url} alt={cover.alt || title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
        {rest.map((image, idx) => (
          <button key={image.id} onClick={() => openAt(idx + 1)} className="relative hidden sm:block group">
            <Image src={image.url} alt={image.alt || title} fill sizes="25vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {idx === rest.length - 1 && sorted.length > 5 && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                <span className="text-white font-bold text-sm">+{sorted.length - 5} fotos</span>
              </div>
            )}
          </button>
        ))}
        <button
          onClick={() => openAt(0)}
          className="absolute bottom-3 right-3 sm:right-6 bg-white text-slate-900 text-xs font-semibold px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-slate-50"
        >
          <Images className="w-3.5 h-3.5" />
          Ver todas las fotos
        </button>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 sm:left-6 bg-white/95 text-slate-900 text-xs font-semibold px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-white"
          >
            <PlayCircle className="w-3.5 h-3.5 text-primary" />
            Ver vídeo
          </a>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
          <div className="flex items-center justify-end p-4">
            <button onClick={() => setLightboxOpen(false)} className="text-white p-2 rounded-full hover:bg-white/10" aria-label="Cerrar">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden" ref={emblaRef}>
            <div className="flex h-full">
              {sorted.map((image) => (
                <div key={image.id} className="relative shrink-0 grow-0 basis-full h-full">
                  <Image src={image.url} alt={image.alt || title} fill sizes="100vw" className="object-contain" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={scrollPrev} className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20" aria-label="Anterior">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={scrollNext} className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20" aria-label="Siguiente">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}
    </>
  )
}
