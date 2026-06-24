import { Star } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const reviews = [
  { id: 1, name: 'María García', nationality: '🇪🇸', rating: 5, activity: 'Buceo con instructores certificados', comment: 'Una experiencia increíble. Los instructores son muy profesionales y el mar en Torrevieja es espectacular. Lo recomiendo al 100%.', date: 'Junio 2025' },
  { id: 2, name: 'Thomas Müller', nationality: '🇩🇪', rating: 5, activity: 'Excursión en catamarán al atardecer', comment: 'Absolutely amazing! The sunset was breathtaking and the crew was very friendly. Perfect way to end a day in Torrevieja.', date: 'Mayo 2025' },
  { id: 3, name: 'Anna Kowalska', nationality: '🇵🇱', rating: 5, activity: 'Tour kayak por las lagunas', comment: 'Niesamowite doświadczenie! Różowe lagune są magiczne, a nasz przewodnik był fantastyczny. Gorąco polecam!', date: 'Julio 2025' },
]

export function ReviewsSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Lo que dicen nuestros clientes</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-bold text-slate-900">4.9</span>
            <span className="text-slate-500">de más de 500 reseñas verificadas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4 italic">"{review.comment}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF] font-bold text-sm">
                    {getInitials(review.name)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      {review.name} <span>{review.nationality}</span>
                    </div>
                    <div className="text-xs text-slate-400">{review.date}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Actividad: <span className="font-medium text-slate-600">{review.activity}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
