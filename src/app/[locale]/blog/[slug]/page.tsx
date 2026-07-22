import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Calendar, Clock, ChevronRight, ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getBlogPostBySlug } from '@/lib/services/blog'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80'

function readTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'Artículo no encontrado | BookActivities' }
  return {
    title: `${post.title} | BookActivities`,
    description: post.excerpt || post.content.slice(0, 160),
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Volver al blog
        </Link>

        {post.category && <Badge className="mb-4">{post.category}</Badge>}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-8">
          {post.published_at && (
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(post.published_at)}</span>
          )}
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{readTime(post.content)} min de lectura</span>
        </div>

        <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden mb-10">
          <Image src={post.cover_image || FALLBACK_IMAGE} alt={post.title} fill className="object-cover" priority />
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-100">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-slate-100">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
            Ver más artículos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
