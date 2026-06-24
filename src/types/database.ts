export type UserRole = 'customer' | 'hotel' | 'provider' | 'admin'

export type SubscriptionStatus = 'active' | 'suspended' | 'expired' | 'cancelled' | 'trialing'
export type SubscriptionPlan = 'basic' | 'pro' | 'premium'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type ActivityStatus = 'draft' | 'published' | 'suspended' | 'archived'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  locale: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  profile_id: string
  nationality: string | null
  date_of_birth: string | null
  created_at: string
}

export interface Hotel {
  id: string
  profile_id: string
  name: string
  slug: string
  description: string | null
  address: string
  city: string
  country: string
  stars: number | null
  website: string | null
  phone: string
  tax_id: string | null
  commission_rate: number
  affiliate_code: string
  qr_code_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Provider {
  id: string
  profile_id: string
  company_name: string
  slug: string
  description: string | null
  address: string
  city: string
  country: string
  phone: string
  tax_id: string | null
  logo_url: string | null
  website: string | null
  commission_rate: number
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanRecord {
  id: string
  name: SubscriptionPlan
  display_name: string
  price_monthly: number
  price_annual: number
  stripe_price_monthly_id: string | null
  stripe_price_annual_id: string | null
  max_activities: number
  features: string[]
  is_active: boolean
  created_at: string
}

export interface ProviderSubscription {
  id: string
  provider_id: string
  plan_id: string
  status: SubscriptionStatus
  billing_cycle: 'monthly' | 'annual'
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_start: string
  current_period_end: string
  cancelled_at: string | null
  created_at: string
  updated_at: string
  plan?: SubscriptionPlanRecord
}

export interface Activity {
  id: string
  provider_id: string
  title: string
  slug: string
  description: string
  short_description: string | null
  category_id: string | null
  price_from: number
  duration_minutes: number
  max_participants: number
  min_participants: number
  languages: string[]
  meeting_point: string
  latitude: number | null
  longitude: number | null
  city: string
  country: string
  cancellation_policy: string
  included: string[]
  excluded: string[]
  requirements: string[]
  status: ActivityStatus
  featured: boolean
  rating: number
  review_count: number
  booking_count: number
  created_at: string
  updated_at: string
  provider?: Provider
  images?: ActivityImage[]
  category?: Category
}

export interface ActivityImage {
  id: string
  activity_id: string
  url: string
  alt: string | null
  is_cover: boolean
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  activity_id: string
  customer_id: string
  hotel_id: string | null
  provider_id: string
  booking_date: string
  activity_date: string
  activity_time: string
  participants: number
  total_price: number
  status: ReservationStatus
  notes: string | null
  hotel_commission: number
  platform_commission: number
  affiliate_code: string | null
  confirmation_code: string
  created_at: string
  updated_at: string
  activity?: Activity
  customer?: Profile
  hotel?: Hotel
}

export interface Commission {
  id: string
  reservation_id: string
  hotel_id: string | null
  provider_id: string
  hotel_commission_amount: number
  platform_commission_amount: number
  total_amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  created_at: string
}

export interface Review {
  id: string
  activity_id: string
  customer_id: string
  reservation_id: string
  rating: number
  title: string | null
  comment: string | null
  is_verified: boolean
  is_published: boolean
  created_at: string
  customer?: Profile
}

export interface Favorite {
  id: string
  customer_id: string
  activity_id: string
  created_at: string
  activity?: Activity
}

export interface Message {
  id: string
  from_id: string
  to_id: string
  reservation_id: string | null
  subject: string
  body: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface AffiliateLink {
  id: string
  hotel_id: string
  code: string
  url: string
  clicks: number
  conversions: number
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_id: string
  category: string | null
  tags: string[]
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile }
      customers: { Row: Customer }
      hotels: { Row: Hotel }
      providers: { Row: Provider }
      subscription_plans: { Row: SubscriptionPlanRecord }
      provider_subscriptions: { Row: ProviderSubscription }
      activities: { Row: Activity }
      activity_images: { Row: ActivityImage }
      categories: { Row: Category }
      reservations: { Row: Reservation }
      commissions: { Row: Commission }
      reviews: { Row: Review }
      favorites: { Row: Favorite }
      messages: { Row: Message }
      notifications: { Row: Notification }
      affiliate_links: { Row: AffiliateLink }
      blog_posts: { Row: BlogPost }
    }
  }
}
