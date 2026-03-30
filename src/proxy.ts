import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
 
const PROTECTED = ['/dashboard', '/profil', '/arrangementer', '/admin', '/skjemaer']
 
// Admin e-poster — disse sendes rett til /admin etter innlogging
const ADMIN_EMAILS = ['haarogmag@gmail.com']
 
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
 
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
 
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
 
  // Ikke innlogget → send til login
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
 
  if (user) {
    const isAdmin = ADMIN_EMAILS.includes(user.email ?? '')
 
    // Innlogget på /login → send til riktig sted
    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? '/admin' : '/dashboard'
      return NextResponse.redirect(url)
    }
 
    // Admin som besøker /dashboard → send til /admin
    if (pathname === '/dashboard' && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
 
    // Vanlig bruker som prøver å gå til /admin → send til /dashboard
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }
 
  return response
}
 
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
