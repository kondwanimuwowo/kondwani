import { NextResponse } from "next/server"
import { db, client as clientTable } from "@/lib/db"
import { asc } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const clients = await db.select().from(clientTable).orderBy(asc(clientTable.name))
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const [row] = await db.insert(clientTable).values(body).returning()
  return NextResponse.json(row, { status: 201 })
}
