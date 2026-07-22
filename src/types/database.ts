export type UserRole = 'customer' | 'hotel' | 'provider' | 'admin'
export type SubscriptionStatus = 'active' | 'suspended' | 'expired' | 'cancelled' | 'trialing'
export type SubscriptionPlan = 'basic' | 'pro' | 'premium'

// Expanded reservation status — matches state machine
export type ReservationStatus =
  | 'pending'    // = PENDING_PROVIDER_CONFIRMATION
  | 'confirmed'  // = CONFIRMED
  | 'rejected'   // = REJECTED (terminal)
  | 'cancelled'  // = CANCELLED (terminal)
  | 'completed'  // = COMPLETED (terminal)
  | 'no_show'    // = NO_SHOW (terminal)

// Terminal statuses (no further transitions allowed)
export const TERMINAL_STATUSES: ReservationStatus[] = ['rejected', 'cancelled', 'completed', 'no_show']

// Valid transitions per status (mirrors DB function)
export const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending:   ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled', 'completed', 'no_show'],
  rejected:  [],
  cancelled: [],
  completed: [],
  no_show:   [],
}

export type ReservationSource = 'qr' | 'web' | 'direct'
export type ActivityStatus = 'draft' | 'pending_review' | 'published' | 'suspended' | 'archived'
export type ExternalBookingPlatform = 'bokun' | 'turitop' | 'civitatis' | 'getyourguide' | 'clickandboat' | 'other'
export type CouponDiscountType = 'percent' | 'fixed'

// =====================================================
// CORE ENTITIES
// =====================================================

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
  tracking_url: string | null
  qr_code_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  profile?: { email: string; full_name: string | null }
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
  subscription?: ProviderSubscription
  profile?: { email: string; full_name: string | null }
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
  google_maps_url?: string | null
  video_url: string | null
  faqs: { question: string; answer: string }[]
  extra_info: { title: string; content: string }[]
  booking_widget_embed_code: string | null
  external_booking_platform: ExternalBookingPlatform | null
  admin_feedback: string | null
  translations: Record<string, { title: string; short_description: string; description: string }>
  status: ActivityStatus
  featured: boolean
  rating: number
  review_count: number
  booking_count: number
  created_at: string
  updated_at: string
  provider?: Provider | null
  images?: ActivityImage[]
  category?: Category | null
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
  source: ReservationSource
  notes: string | null
  provider_notes: string | null
  hotel_commission: number
  platform_commission: number
  affiliate_code: string | null
  confirmation_code: string
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
  // Joins
  activity?: Activity
  customer?: Profile
  hotel?: Hotel
  provider?: Provider
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
  activity?: { title: string; slug: string; images?: { url: string; is_cover: boolean }[] }
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

export interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: CouponDiscountType
  value: number
  customer_id: string | null // null = public/global, set = personal promo
  valid_from: string
  valid_until: string | null
  usage_limit: number | null
  times_used: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  subscription_id: string | null
  provider_id: string
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  amount: number
  currency: string
  status: string
  description: string | null
  paid_at: string | null
  created_at: string
  provider?: Provider
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

// =====================================================
// DASHBOARD RESULT TYPES
// =====================================================

export interface HotelDashboardStats {
  total_reservations: number
  confirmed_reservations: number
  pending_reservations: number
  completed_reservations: number
  total_participants: number
  estimated_commission: number
  qr_conversions: number
  web_conversions: number
}

export interface HotelTopActivity {
  activity_id: string
  activity_title: string
  total_bookings: number
  total_participants: number
}

export interface ProviderAttributionStats {
  hotel_id: string | null
  hotel_name: string | null
  affiliate_code: string | null
  total_reservations: number
  confirmed: number
  participants: number
  direct_bookings: number
}

export interface ProviderActivityPerformance {
  activity_id: string
  activity_title: string
  total_bookings: number
  confirmed: number
  completed: number
  cancelled: number
  total_participants: number
  avg_rating: number
  hotel_attributed: number
  direct_bookings: number
}

export interface PlatformStats {
  total_reservations: number
  pending_count: number
  confirmed_count: number
  completed_count: number
  active_providers: number
  active_hotels: number
  hotel_attributed: number
  direct_bookings: number
  mrr_eur: number
}

// =====================================================
// DATABASE TYPE MAP
// Supabase requires Row + Insert + Update per table.
// We use Partial<Row> for Insert/Update — good enough for type-safety
// without duplicating every field definition.
// =====================================================

// Intersection with Record<string, unknown> satisfies Supabase's GenericTable constraint
// (interfaces without index signatures don't satisfy Record<string, unknown> directly).
// Insert/Update are intentionally broad — type-checking on specific insert fields happens
// at the service layer via explicit input types, not here.
type TableOf<T> = {
  Row: T & Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: never[]
}

export interface Database {
  public: {
    Tables: {
      profiles:               TableOf<Profile>
      customers:              TableOf<Customer>
      hotels:                 TableOf<Hotel>
      providers:              TableOf<Provider>
      subscription_plans:     TableOf<SubscriptionPlanRecord>
      provider_subscriptions: TableOf<ProviderSubscription>
      activities:             TableOf<Activity>
      activity_images:        TableOf<ActivityImage>
      categories:             TableOf<Category>
      reservations:           TableOf<Reservation>
      commissions:            TableOf<Commission>
      reviews:                TableOf<Review>
      favorites:              TableOf<Favorite>
      messages:               TableOf<Message>
      notifications:          TableOf<Notification>
      affiliate_links:        TableOf<AffiliateLink>
      blog_posts:             TableOf<BlogPost>
      coupons:                TableOf<Coupon>
      payments:               TableOf<Payment>
    }
    Views: {
      public_review_authors: {
        Row: { id: string; full_name: string | null; avatar_url: string | null } & Record<string, unknown>
        Relationships: never[]
      }
    }
    Functions: {
      transition_reservation: {
        Args: { p_reservation_id: string; p_new_status: string; p_notes?: string | null }
        Returns: Reservation
      }
      submit_activity_for_review: {
        Args: { p_activity_id: string }
        Returns: Activity
      }
      review_activity_submission: {
        Args: { p_activity_id: string; p_approve: boolean; p_feedback?: string | null }
        Returns: Activity
      }
      get_hotel_dashboard_stats: {
        Args: { p_hotel_id: string }
        Returns: HotelDashboardStats[]
      }
      get_hotel_top_activities: {
        Args: { p_hotel_id: string; p_limit?: number }
        Returns: HotelTopActivity[]
      }
      get_provider_attribution_stats: {
        Args: { p_provider_id: string }
        Returns: ProviderAttributionStats[]
      }
      get_provider_activity_performance: {
        Args: { p_provider_id: string }
        Returns: ProviderActivityPerformance[]
      }
      get_platform_stats: {
        Args: Record<string, never>
        Returns: PlatformStats[]
      }
      provider_has_active_subscription: {
        Args: { p_provider_id: string }
        Returns: boolean
      }
      track_affiliate_click: {
        Args: { p_code: string }
        Returns: void
      }
      track_affiliate_conversion: {
        Args: { p_code: string }
        Returns: void
      }
    }
    Enums: {
      user_role: UserRole
      reservation_status: ReservationStatus
      subscription_status: SubscriptionStatus
      activity_status: ActivityStatus
    }
    CompositeTypes: Record<string, never>
  }
}
