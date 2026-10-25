import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/admin-emails'

// /account pages that signed-out visitors may open
const PUBLIC_ACCOUNT_PATHS = ['/account/login', '/account/register', '/account/forgot-password']

export async function proxy(request: NextRequest) {
  // DEMO MODE (no Supabase configured): skip auth/session handling entirely.
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (process.env.DEMO_MODE === '1' || !sbUrl || sbUrl.includes('placeholder')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  // Refresh the Supabase session on every request (required by @supabase/ssr)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getUser() — not getSession() — for authorization (see @supabase/ssr docs)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const toLogin = () => {
    const url = request.nextUrl.clone()
    url.pathname = '/account/login'
    url.search = ''
    url.searchParams.set('redirect', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  // Protect /admin — signed-in user must be in ADMIN_EMAILS (comma list) or ADMIN_EMAIL.
  // (Admin pages and server actions also call requireAdmin() from src/lib/admin.ts.)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!user || !isAdminEmail(user.email)) return toLogin()
  }

  // Protect /account/* for signed-out visitors (except login/register/forgot-password)
  if (
    (pathname === '/account' || pathname.startsWith('/account/')) &&
    !PUBLIC_ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) &&
    !user
  ) {
    return toLogin()
  }

  // Redirect logged-in users away from login/register
  if (user && (pathname === '/account/login' || pathname === '/account/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/account'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     * - multipart upload endpoints (apply/submit, account/settings/certificate):
     *   they authenticate themselves, and skipping proxy avoids its 10 MB body buffer
     */
    '/((?!_next/static|_next/image|favicon.ico|apply/submit|account/settings/certificate|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
