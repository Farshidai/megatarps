import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  // Protect /admin — only allow ADMIN_EMAIL
  if (pathname.startsWith('/admin')) {
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      const url = request.nextUrl.clone()
      url.pathname = '/account/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
