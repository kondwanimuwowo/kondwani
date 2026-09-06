import { NextResponse } from "next/server"
import { db, client as clientTable } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const row = await db.query.client.findFirst({ where: (t, { eq }) => eq(t.id, id) })
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(row)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const [row] = await db.update(clientTable).set(body).where(eq(clientTable.id, id)).returning()
  return NextResponse.json(row)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(clientTable).where(eq(clientTable.id, id))
  return NextResponse.json({ ok: true })
}
