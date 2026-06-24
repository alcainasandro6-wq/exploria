import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Exploria',
  description: 'Consejos, guías y noticias sobre turismo en Torrevieja y la Costa Blanca.',
}

const POSTS = [
  {
    id: 1, slug: 'mejores-playas-torrevieja', title: 'Las 10 mejores playas de Torrevieja para 2025',
    excerpt: 'Descubre cuáles son las playas más impresionantes de Torrevieja, desde la icónica Playa del Cura hasta las tranquilas calas escondidas.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    category: 'Guías', readTime: 8, date: '2025-07-01', author: 'Equipo Exploria'
  },
  {
    id: 2, slug: 'buceo-novatos-torrevieja', title: 'Guía completa de buceo para principiantes en Torrevieja',
    excerpt: 'Todo lo que necesitas saber para hacer tu primera inmersión en las cristalinas aguas del Mediterráneo. Consejos, seguridad y los mejores puntos de buceo.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    category: 'Actividades', readTime: 12, date: '2025-06-25', author: 'María García'
  },
  {
    id: 3, slug: 'gastronomia-alicantina', title: 'Gastronomía alicantina: lo que tienes que probar en Torrevieja',
    excerpt: 'Del arroz con costra a la caldosa, pasando por los mejores bares de tapas. Una guía gastronómica completa para disfrutar la cocina local.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    category: 'Gastronomía', readTime: 6, date: '2025-06-18', author: 'Carlos Martínez'
  },
  {
    id: 4, slug: 'laguna-rosada', title: 'La laguna rosada de Torrevieja: por qué es única en el mundo',
    excerpt: 'La laguna de Torrevieja es una de las más saladas del mundo y su característico color rosa la convierte en un espectáculo natural único. Te explicamos por qué.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    category: 'Naturaleza', readTime: 5, date: '2025-06-10', author: 'Ana López'
  },
  {
    id: 5, slug: 'kayak-lagunas', title: 'Kayak por las lagunas de Torrevieja: una experiencia única',
    excerpt: 'Explorar las lagunas de Torrevieja y La Mata en kayak es una de las actividades más especiales que puedes hacer en la Costa Blanca. Te contamos todo.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    category: 'Actividades', readTime: 7, date: '2025-06-05', author: 'Pedro Sánchez'
  },
  {
    id: 6, slug: 'torrevieja-que-ver', title: 'Qué ver y hacer en Torrevieja: guía completa 2025',
    excerpt: 'Una guía completa con los imprescindibles de Torrevieja. Playas, actividades, gastronomía, cultura y todos los secretos que los locales conocen.',
    image: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80',
    category: 'Guías', readTime: 15, date: '2025-05-28', author: 'Equipo Exploria'
  },
]

const CATEGORIES = ['Todas', 'Guías', 'Actividades', 'Gastronomía', 'Naturaleza']

export default function BlogPage() {
  const featuredPost = POSTS[0]
  const restPosts = POSTS.slice(1)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0066FF] to-[#003d99] py-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold mb-3">Blog de Exploria</h1>
          <p className="text-blue-100">Guías, consejos y noticias sobre Torrevieja y la Costa Blanca</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Category filters */}
        <div className="flex gap-2 mb-10 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                cat === 'Todas'
                  ? 'bg-[#0066FF] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <Link href={`/blog/${featuredPost.slug}`} className="group block mb-12">
          <div className="grid md:grid-cols-2 gap-6 bg-slate-50 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-56 md:h-auto">
              <Image
                src={featuredPost.image}
                alt={featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <Badge className="mb-3 w-fit">{featuredPost.category}</Badge>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3 group-hover:text-[#0066FF] transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{featuredPost.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{featuredPost.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featuredPost.readTime} min</span>
                <span>{featuredPost.author}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <Badge variant="secondary" className="mb-2 text-xs">{post.category}</Badge>
                  <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 group-hover:text-[#0066FF] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime} min</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
