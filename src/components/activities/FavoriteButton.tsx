'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleFavoriteAction } from '@/app/actions/customer'
import { toast } from 'sonner'

interface FavoriteButtonProps {
  activityId: string
  className?: string
  initialFavorited?: boolean
}

export function FavoriteButton({ activityId, className, initialFavorited = false }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [pending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      const res = await toggleFavoriteAction(activityId)
      if (!res.success) {
        if (res.error === 'Not authenticated') {
          window.location.href = '/auth/login'
          return
        }
        toast.error(res.error)
        return
      }
      setFavorited(res.favorited ?? false)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={cn('w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow', className)}
      aria-label="Guardar en favoritos"
    >
      <Heart className={cn('w-3.5 h-3.5 transition-colors', favorited ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500')} />
    </button>
  )
}
