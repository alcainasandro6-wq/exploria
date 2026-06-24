'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CATEGORIES } from '@/lib/constants'
import { ArrowUpRight } from 'lucide-react'

const CATEGORY_IMAGES: Record<string, string> = {
  'water-sports': 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=600&q=80',
  'boat-tours':   'https://images.unsplash.com/photo-1534187886935-1e1236e856c3?w=600&q=80',
  'kayak':        'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80',
  'diving':       'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
  'cultural':     'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
  'gastronomy':   'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  'nature':       'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
  'nightlife':    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80',
}

export function Categories() {
  const t = useTranslations('home')

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A56FF] mb-3">
              Explora por categoría
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight leading-none">
              {t('categories_title')}
            </h2>
          </div>
          <Link
            href="/activities"
            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#1A56FF] transition-colors"
          >
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((category, i) => (
            <Link
              key={category.id}
              href={`/activities?category=${category.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${CATEGORY_IMAGES[category.id] ?? CATEGORY_IMAGES['gastronomy']})` }}
              />
              {/* Always-on dark layer */}
              <div className="absolute inset-0 bg-[#070D1F]/45 group-hover:bg-[#070D1F]/55 transition-colors duration-300" />
              {/* Gradient from bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070D1F]/80 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <span className="text-[11px] font-bold text-white/35 tracking-[0.2em] font-mono">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold text-white leading-snug">
                    {category.name}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white flex items-center justify-center transition-colors duration-300 shrink-0 ml-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white group-hover:text-[#070D1F] transition-colors duration-300" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
