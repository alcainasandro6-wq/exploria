import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPublishedBlogPosts } from '@/lib/services/blog'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | BookActivities',
  description: 'Consejos, guías y noticias sobre turismo en Torrevieja y la Costa Blanca.',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

function readTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200))
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-primary to-primary-dark py-16">
          <div className="max-w-5xl mx-auto px-4 text-center text-white">
            <h1 className="text-4xl font-extrabold mb-3">Blog de BookActivities</h1>
            <p className="text-blue-100">Guías, consejos y noticias sobre Torrevieja y la Costa Blanca</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">
          Todavía no hay artículos publicados.
        </div>
      </div>
    )
  }

  const [featuredPost, ...restPosts] = posts

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark py-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold mb-3">Blog de BookActivities</h1>
          <p className="text-blue-100">Guías, consejos y noticias sobre Torrevieja y la Costa Blanca</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Featured Post */}
        <Link href={`/blog/${featuredPost.slug}`} className="group block mb-12">
          <div className="grid md:grid-cols-2 gap-6 bg-slate-50 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-56 md:h-auto">
              <Image
                src={featuredPost.cover_image || FALLBACK_IMAGE}
                alt={featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              {featuredPost.category && <Badge className="mb-3 w-fit">{featuredPost.category}</Badge>}
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3 group-hover:text-primary transition-colors">
                {featuredPost.title}
              </h2>
              {featuredPost.excerpt && (
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{featuredPost.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {featuredPost.published_at && (
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(featuredPost.published_at)}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readTime(featuredPost.content)} min</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Grid */}
        {restPosts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={post.cover_image || FALLBACK_IMAGE}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    {post.category && <Badge variant="secondary" className="mb-2 text-xs">{post.category}</Badge>}
                    <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{post.excerpt}</p>}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{post.published_at ? formatDate(post.published_at) : ''}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readTime(post.content)} min</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
