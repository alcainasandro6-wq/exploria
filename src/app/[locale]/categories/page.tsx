import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { getCategories } from '@/lib/services/categories'
import { Reveal } from '@/components/ui/reveal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Categorías de actividades | BookActivities',
  description: 'Explora todas las categorías de experiencias disponibles en Torrevieja.',
}

export default async function CategoriesPage() {
  const [categories, t, tc] = await Promise.all([
    getCategories(),
    getTranslations('categories_page'),
    getTranslations('home'),
  ])

  return (
    <div className="min-h-screen bg-white">
      <Reveal className="bg-gradient-to-br from-[#0A0F1E] via-primary-dark to-primary py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{tc('categories_title')}</h1>
        <p className="text-blue-100/80 max-w-xl mx-auto">{t('subtitle')}</p>
      </Reveal>

      <Reveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12" delay={100}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/activities?category=${cat.slug}`}
              className="group bg-slate-50 hover:bg-primary/5 border border-slate-100 hover:border-primary/30 rounded-2xl p-6 text-center transition-colors"
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{cat.name}</p>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  )
}
