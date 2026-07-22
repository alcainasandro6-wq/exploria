'use client'

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { submitReviewAction } from '@/app/actions/customer'
import { toast } from 'sonner'

export function ReviewForm({ reservationId, activityId, activityTitle }: { reservationId: string; activityId: string; activityTitle: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (done) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    const res = await submitReviewAction({ activityId, reservationId, rating, comment: comment.trim() || undefined })
    setSubmitting(false)
    if (!res.success) { toast.error(res.error); return }
    toast.success('¡Gracias por tu valoración!')
    setDone(true)
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="font-semibold text-slate-900 mb-2">{activityTitle}</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)}>
            <Star className={`w-6 h-6 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Cuéntanos qué tal fue tu experiencia (opcional)"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
      />
      <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Enviar valoración
      </Button>
    </div>
  )
}
