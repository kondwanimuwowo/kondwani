import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

// Only the client portal needs the session; running it on public pages
// added a Supabase Auth round trip to every page view.
export const config = {
  matcher: ['/portal/:path*'],
}
