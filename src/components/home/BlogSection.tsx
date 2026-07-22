import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Calendar, Clock, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPublishedBlogPosts } from '@/lib/services/blog'
import { formatDate } from '@/lib/utils'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'

function readTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200))
}

export async function BlogSection() {
  const posts = (await getPublishedBlogPosts()).slice(0, 4)
  if (posts.length === 0) return null

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
              Del blog
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-[#070D1F] tracking-tight leading-none">
              Guías y consejos
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            Ver todos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={post.cover_image || FALLBACK_IMAGE}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <div className="p-5">
                  {post.category && <Badge variant="secondary" className="mb-2 text-xs">{post.category}</Badge>}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
                    {post.published_at && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.published_at)}</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readTime(post.content)} min</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Ver todos los artículos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
