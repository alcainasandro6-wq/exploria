import { Link } from '@/i18n/navigation'
import { ArrowUpRight } from 'lucide-react'
import { ParallaxImage } from '@/components/ui/parallax-image'
import { Reveal } from '@/components/ui/reveal'
import { getPublishedBlogPosts } from '@/lib/services/blog'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types/database'
import { getTranslations } from 'next-intl/server'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'
export async function BlogSection() {
  const t = await getTranslations('home')
  const dbPosts = await getPublishedBlogPosts()
  
  const posts = [...dbPosts]
  if (posts.length > 0 && posts.length < 5) {
    const fallbackPosts: BlogPost[] = [
      {
        id: 'fallback-1',
        title: 'Las salinas de Torrevieja: el secreto de su lodo terapéutico',
        slug: 'salinas-lodo-terapeutico-torrevieja',
        excerpt: 'Descubre los increíbles beneficios del lodo de las salinas de Torrevieja y cómo disfrutar de esta terapia natural de forma segura.',
        cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        category: 'Salud',
        content: '',
        author_id: '',
        tags: [],
        is_published: true,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'fallback-2',
        title: 'Los mejores restaurantes de Torrevieja frente al mar',
        slug: 'mejores-restaurantes-vistas-mar-torrevieja',
        excerpt: 'Una cuidada selección de los mejores locales para degustar la gastronomía mediterránea con las olas del mar de fondo.',
        cover_image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
        category: 'Gastronomía',
        content: '',
        author_id: '',
        tags: [],
        is_published: true,
        published_at: '2026-07-22T00:00:00.000Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    while (posts.length < 5) {
      posts.push(fallbackPosts[posts.length % fallbackPosts.length])
    }
  }

  if (posts.length === 0) return null

  const [hero, ...rest] = posts
  const secondary = rest.slice(0, 4)

  return (
    <section className="blog-section">
      <div className="blog-container">

        {/* Section header */}

        <Reveal className="blog-header">
          <div>
            <p className="blog-label">{t('blog_label')}</p>
            <h2 className="blog-title">
              {t.rich('blog_title', { br: () => <br /> })}
            </h2>
          </div>
          <Link href="/blog" className="blog-all-link group">
            {t('blog_view_all')}
            <ArrowUpRight className="blog-all-icon" />
          </Link>
        </Reveal>
        <Reveal className="blog-grid" delay={120}>

          {/* Hero post — left, tall */}
          <Link
            href={`/blog/${hero.slug}`}
            className="blog-hero-card group"
          >
            <div className="blog-hero-img">
              <ParallaxImage
                src={hero.cover_image || FALLBACK_IMAGE}
                alt={hero.title}
                speed={0.08}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="blog-hero-scrim" />
            <div className="blog-hero-body">
              {hero.category && (
                <span className="blog-category">{hero.category}</span>
              )}
              <h3 className="blog-hero-title">{hero.title}</h3>
              {hero.excerpt && (
                <p className="blog-hero-excerpt">{hero.excerpt}</p>
              )}
              <span className="blog-read-link">
                Leer artículo <ArrowUpRight className="blog-read-icon" />
              </span>
            </div>
          </Link>

          {/* Secondary posts — right column list */}
          <div className="blog-list">
            {secondary.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="blog-item group"
              >
                <div className="blog-item-img">
                  <ParallaxImage
                    src={post.cover_image || FALLBACK_IMAGE}
                    alt={post.title}
                    speed={0.05}
                    sizes="120px"
                  />
                </div>
                <div className="blog-item-body">
                  {post.category && (
                    <span className="blog-item-cat">{post.category}</span>
                  )}
                  <h3 className="blog-item-title">{post.title}</h3>
                  {post.published_at && (
                    <span className="blog-item-date">{formatDate(post.published_at)}</span>
                  )}
                </div>
                <ArrowUpRight className="blog-item-arrow" />
              </Link>
            ))}

            {/* Mobile CTA */}
            <div className="blog-mobile-cta">
              <Link href="/blog" className="blog-all-link group">
                {t('blog_view_all')} <ArrowUpRight className="blog-all-icon" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
