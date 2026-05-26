import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // protect /portal routes
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/portal') &&
    request.nextUrl.pathname !== '/portal/login' &&
    !request.nextUrl.pathname.startsWith('/portal/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal/login'
    return NextResponse.redirect(url)
  }

  // Redirect to portal if logged in and accessing login page
  if (
    user &&
    request.nextUrl.pathname === '/portal/login'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
