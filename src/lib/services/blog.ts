import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import type { BlogPost } from '@/types/database'

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPublishedBlogPosts(limit = 30): Promise<BlogPost[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  
  if (data) return data

  // Mock fallbacks for missing blog articles
  if (slug === 'salinas-lodo-terapeutico-torrevieja') {
    return {
      id: 'fallback-1',
      title: 'Las salinas de Torrevieja: el secreto de su lodo terapéutico',
      slug: 'salinas-lodo-terapeutico-torrevieja',
      excerpt: 'Descubre los increíbles beneficios del lodo de las salinas de Torrevieja y cómo disfrutar de esta terapia natural de forma segura.',
      cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
      category: 'Salud',
      content: `Las Salinas de Torrevieja, conocidas científicamente como la Laguna Rosa, son mucho más que un espectáculo visual impresionante para fotos de Instagram. Este ecosistema único es una fuente inagotable de propiedades terapéuticas naturales que atrae a visitantes de todo el mundo en busca de bienestar y salud.\n\nEl lodo de las salinas, formado a lo largo de siglos por la acumulación de sedimentos ricos en sal, minerales y microalgas (como la Dunaliella salina, responsable de su icónico tono rosa), es el verdadero tesoro de la laguna.\n\nBeneficios comprobados del lodo:\n1. Propiedades antiinflamatorias: Ideal para aliviar dolores musculares y articulares, artritis o reumatismo.\n2. Regenerador cutáneo: Actúa como un exfoliante natural de alta potencia, eliminando células muertas y toxinas.\n3. Alivio de afecciones de la piel: Ayuda notablemente en casos de psoriasis, eccemas o acné gracias a su alta salinidad y minerales.\n\n¿Cómo disfrutar de la terapia de forma segura?\n- Aplica una capa fina de lodo en las zonas deseadas de tu cuerpo.\n- Deja que se seque al sol durante unos 15 a 20 minutos hasta que se solidifique.\n- Aclárate en la propia laguna o utiliza agua dulce para retirar los restos.\n- Recuerda hidratarte bien antes y después de la sesión.\n\nConsejo para el visitante: Visita la laguna a última hora de la tarde para combinar tu baño terapéutico con uno de los atardeceres más mágicos de la Costa Blanca.`,
      author_id: 'system',
      tags: ['Salinas', 'Salud', 'Torrevieja', 'Terapia'],
      is_published: true,
      published_at: '2026-07-23T12:00:00.000Z',
      created_at: '2026-07-23T12:00:00.000Z',
      updated_at: '2026-07-23T12:00:00.000Z'
    }
  }

  if (slug === 'mejores-restaurantes-vistas-mar-torrevieja') {
    return {
      id: 'fallback-2',
      title: 'Los mejores restaurantes de Torrevieja frente al mar',
      slug: 'mejores-restaurantes-vistas-mar-torrevieja',
      excerpt: 'Una cuidada selección de los mejores locales para degustar la gastronomía mediterránea con las olas del mar de fondo.',
      cover_image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&q=80',
      category: 'Gastronomía',
      content: `Degustar un arroz a banda o una caldereta de marisco fresco mientras contemplas la inmensidad del Mar Mediterráneo es una experiencia que define el estilo de vida de Torrevieja. La gastronomía local es rica, honesta y está profundamente vinculada al puerto pesquero de la ciudad.\n\nAquí te presentamos una guía con las mejores opciones de restauración en primera línea de playa:\n\nEl Embarcadero de Torrevieja:\nEspecializado en pescados a la sal y mariscos capturados el mismo día. Su terraza exterior flota virtualmente sobre el agua, ofreciendo unas vistas ininterrumpidas de los barcos entrando al puerto.\n\nLa Pescadería del Puerto:\nUn local de ambiente marinero tradicional donde el producto es el rey absoluto. Su arroz con bogavante es famoso en toda la comarca de la Vega Baja.\n\nSunset Beach Bar & Restaurante:\nPerfecto para quienes buscan una fusión moderna. Ofrece platos tradicionales con un toque de autor, ideales para disfrutar de una cena bajo la luz de la luna con música en vivo de fondo.\n\nRecomendaciones gastronómicas para tu visita:\n- No te vayas sin probar el "caldero", el plato de arroz caldoso típico de los pescadores.\n- Acompaña tu comida con un vino blanco de la vecina de denominación de origen de La Mata.\n- Reserva con antelación si planeas ir en fin de semana, especialmente durante los meses de verano.`,
      author_id: 'system',
      tags: ['Restaurantes', 'Gastronomía', 'Costa Blanca', 'Turismo'],
      is_published: true,
      published_at: '2026-07-23T11:00:00.000Z',
      created_at: '2026-07-23T11:00:00.000Z',
      updated_at: '2026-07-23T11:00:00.000Z'
    }
  }

  return null
}
