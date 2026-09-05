import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db, client as clientTable } from "@/lib/db"
import { eq } from "drizzle-orm"

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
  let clientRow = await db.query.client.findFirst({ where: (t, { eq }) => eq(t.userId, user.id) })

  // Auto-link on first login: match by email and claim the userId
  if (!clientRow && user.email) {
    clientRow = await db.query.client.findFirst({ where: (t, { eq }) => eq(t.email, user.email!) }).catch(() => undefined)
    if (clientRow && !clientRow.userId) {
      await db.update(clientTable).set({ userId: user.id }).where(eq(clientTable.id, clientRow.id))
    } else if (clientRow?.userId && clientRow.userId !== user.id) {
      // Email matches a client already claimed by a different account
      clientRow = undefined
    }
  }

  if (!clientRow) {
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
