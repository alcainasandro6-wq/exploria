'use client'

import Image from 'next/image'
import { useParallax } from '@/hooks/useParallax'
import { cn } from '@/lib/utils'

interface ParallaxImageProps {
  src: string
  alt: string
  sizes?: string
  speed?: number
  className?: string
  priority?: boolean
}

export function ParallaxImage({ src, alt, sizes, speed = 0.12, className, priority }: ParallaxImageProps) {
  const ref = useParallax<HTMLDivElement>(speed)

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={ref} className="absolute -inset-y-6 inset-x-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn('object-cover', className)}
        />
      </div>
    </div>
  )
}
