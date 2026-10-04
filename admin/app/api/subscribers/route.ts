import { db, newsletterSubscriber } from "@/lib/db"
import { desc } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const subscribers = await db.select().from(newsletterSubscriber).orderBy(desc(newsletterSubscriber.createdAt))
  return NextResponse.json(subscribers)
}
