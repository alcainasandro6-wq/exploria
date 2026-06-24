'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CATEGORIES } from '@/lib/constants'

const CATEGORY_IMAGES: Record<string, string> = {
  'water-sports':  'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=600&q=80',
  'boat-tours':    'https://images.unsplash.com/photo-1534187886935-1e1236e856c3?w=600&q=80',
  'kayak':         'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  'diving':        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  'cultural':      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
  'gastronomy':    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  'nature':        'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
  'nightlife':     'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80',
}

export function Categories() {
  const t = useTranslations('home')

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{t('categories_title')}</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            Desde deportes acuáticos hasta gastronomía, tenemos la experiencia perfecta para ti
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/activities?category=${category.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${CATEGORY_IMAGES[category.id] || CATEGORY_IMAGES['gastronomy']})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/85 transition-colors duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-white">
                <span className="text-2xl mb-1.5">{category.icon}</span>
                <span className="text-sm font-bold text-center leading-tight">{category.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
