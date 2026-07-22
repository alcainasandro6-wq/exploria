import { Link } from '@/i18n/navigation'
import { getCategories } from '@/lib/services/categories'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Categorías de actividades | BookActivities',
  description: 'Explora todas las categorías de experiencias disponibles en Torrevieja.',
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-[#0A0F1E] via-primary-dark to-primary py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Explora por categoría</h1>
        <p className="text-blue-100/80 max-w-xl mx-auto">
          Todas nuestras experiencias, organizadas por tipo de actividad.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      </div>
    </div>
  )
}
