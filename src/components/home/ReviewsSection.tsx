import { Star, Quote } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const reviews = [
  {
    id: 1,
    name: 'María García',
    country: 'ES',
    rating: 5,
    activity: 'Buceo con instructores certificados',
    comment: 'Una experiencia increíble. Los instructores son muy profesionales y el mar en Torrevieja es espectacular. Lo recomiendo al 100%.',
    date: 'Junio 2025',
  },
  {
    id: 2,
    name: 'Thomas Müller',
    country: 'DE',
    rating: 5,
    activity: 'Excursión en catamarán al atardecer',
    comment: 'Absolutely amazing! The sunset was breathtaking and the crew was very friendly. Perfect way to end a day in Torrevieja.',
    date: 'Mayo 2025',
  },
  {
    id: 3,
    name: 'Anna Kowalska',
    country: 'PL',
    rating: 5,
    activity: 'Tour kayak por las lagunas',
    comment: 'Niesamowite doświadczenie! Różowe lagune są magiczne, a nasz przewodnik był fantastyczny. Gorąco polecam wszystkim!',
    date: 'Julio 2025',
  },
]

export function ReviewsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005B8D] mb-3">
            Opiniones reales
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight mb-5">
            Lo que dicen nuestros clientes
          </h2>
          <div className="inline-flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-full px-5 py-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm font-black text-[#070D1F]">4.9</span>
            <span className="text-xs text-slate-400">de más de 500 reseñas verificadas</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex flex-col">
              {/* Quote icon */}
              <Quote className="w-6 h-6 text-[#005B8D]/20 mb-4 shrink-0" />

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                ))}
              </div>

              {/* Comment */}
              <p className="text-slate-700 text-sm leading-relaxed flex-1 mb-5">
                {review.comment}
              </p>

              {/* Activity */}
              <p className="text-[11px] text-slate-400 mb-4 pb-4 border-b border-slate-200">
                Actividad: <span className="font-semibold text-slate-500">{review.activity}</span>
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#005B8D]/10 flex items-center justify-center text-[#005B8D] font-black text-xs shrink-0">
                  {getInitials(review.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#070D1F]">{review.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200 rounded px-1.5 py-0.5 tracking-widest">
                      {review.country}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
