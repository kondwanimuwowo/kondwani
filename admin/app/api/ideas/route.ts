import { db, idea as ideaTable } from "@/lib/db"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const ideas = await db.query.idea.findMany({ orderBy: (t, { desc }) => desc(t.createdAt) })
  return NextResponse.json(ideas)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const [idea] = await db.insert(ideaTable).values(body).returning()
  return NextResponse.json(idea, { status: 201 })
}
