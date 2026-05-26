import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/portal"

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login?error=missing-code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/portal/login?error=auth-code-exchange-failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/portal/login?error=no-user`)
  }

  // Try to find an existing client linked to this Supabase user
  let client = await prisma.client.findUnique({ where: { userId: user.id } })

  // Auto-link on first login: match by email and claim the userId
  if (!client && user.email) {
    client = await prisma.client.findUnique({ where: { email: user.email } }).catch(() => null)
    if (client && !client.userId) {
      await prisma.client.update({
        where: { id: client.id },
        data: { userId: user.id },
      })
    } else if (client?.userId && client.userId !== user.id) {
      // Email matches a client already claimed by a different account
      client = null
    }
  }

  if (!client) {
    // No matching client — sign them out and redirect to access-denied
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/portal/login?error=no-access`)
  }

  const base = process.env.NODE_ENV === "development"
    ? origin
    : request.headers.get("x-forwarded-host")
      ? `https://${request.headers.get("x-forwarded-host")}`
      : origin

  return NextResponse.redirect(`${base}${next}`)
}
