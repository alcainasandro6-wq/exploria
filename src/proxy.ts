import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

const protectedPaths = ['/dashboard']
const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password']
const DASHBOARD_ROLES = ['customer', 'hotel', 'provider', 'admin'] as const

const ATTRIBUTION_COOKIE = 'bookactivities_ref'
const ATTRIBUTION_MAX_AGE = 30 * 24 * 60 * 60  // 30 days in seconds

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const localePattern = /^\/(es|en|fr|de|pl|ru)(\/.*)?$/
  const match = pathname.match(localePattern)
  const pathWithoutLocale = match ? match[2] || '/' : pathname

  const { supabaseResponse, user, role } = await updateSession(request)

  const isProtected = protectedPaths.some((p) => pathWithoutLocale.startsWith(p))
  const isAuth = authPaths.some((p) => pathWithoutLocale.startsWith(p))

  if (isProtected && !user) {
    const locale = match ? match[1] : 'en'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/auth/login`
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Role gating: a customer/hotel/provider can't open another role's dashboard.
  // Also redirects bare /dashboard (no page of its own) to the user's own dashboard.
  if (isProtected && user && role) {
    const dashboardMatch = pathWithoutLocale.match(/^\/dashboard(?:\/([^/]+))?/)
    const pathRole = dashboardMatch?.[1]
    const mismatched = pathRole && DASHBOARD_ROLES.includes(pathRole as (typeof DASHBOARD_ROLES)[number]) && pathRole !== role
    if (!pathRole || mismatched) {
      const locale = match ? match[1] : 'en'
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/dashboard/${role}`
      return NextResponse.redirect(url)
    }
  }

  if (isAuth && user) {
    const locale = match ? match[1] : 'en'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/dashboard/${role ?? 'customer'}`
    return NextResponse.redirect(url)
  }

  // --- Attribution: capture ?ref=CODE and persist as cookie (30d) ---
  const refCode = request.nextUrl.searchParams.get('ref')
  const source = request.nextUrl.searchParams.get('source') ?? 'web'

  let response: NextResponse

  const intlResponse = intlMiddleware(request)
  if (intlResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value)
    })
    response = intlResponse
  } else {
    response = supabaseResponse
  }

  if (refCode) {
    const cookieValue = JSON.stringify({ affiliateCode: refCode, source, setAt: Date.now() })
    response.cookies.set(ATTRIBUTION_COOKIE, cookieValue, {
      maxAge: ATTRIBUTION_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,    // readable by client JS for booking form pre-fill
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
