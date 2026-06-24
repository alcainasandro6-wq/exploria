import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

const protectedPaths = ['/dashboard']
const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const localePattern = /^\/(es|en|fr|de|pl|ru)(\/.*)?$/
  const match = pathname.match(localePattern)
  const pathWithoutLocale = match ? match[2] || '/' : pathname

  const { supabaseResponse, user } = await updateSession(request)

  const isProtected = protectedPaths.some((p) => pathWithoutLocale.startsWith(p))
  const isAuth = authPaths.some((p) => pathWithoutLocale.startsWith(p))

  if (isProtected && !user) {
    const locale = match ? match[1] : 'en'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/auth/login`
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuth && user) {
    const locale = match ? match[1] : 'en'
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  const intlResponse = intlMiddleware(request)
  if (intlResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value)
    })
    return intlResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
