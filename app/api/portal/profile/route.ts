import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db, client as clientTable } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to find client by Supabase User ID
    let client = await db.query.client.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    })

    // If not found, check if there is a client with this email that hasn't been linked yet
    if (!client && user.email) {
      const existingClient = await db.query.client.findFirst({
        where: (t, { eq }) => eq(t.email, user.email!),
      })

      if (existingClient && !existingClient.userId) {
        // Link client to this user id
        const [updated] = await db.update(clientTable).set({ userId: user.id }).where(eq(clientTable.id, existingClient.id)).returning()
        client = updated
      }
    }

    if (!client) {
      return NextResponse.json(
        {
          error: "Client profile not found. Please contact Kondwani to register your email.",
          email: user.email,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error: any) {
    console.error("Portal profile error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
