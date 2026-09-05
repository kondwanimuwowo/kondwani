import { NextResponse } from "next/server"
import { db, workTask } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const [task] = await db.update(workTask).set(body).where(eq(workTask.id, id)).returning()
  return NextResponse.json(task)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(workTask).where(eq(workTask.id, id))
  return NextResponse.json({ ok: true })
}
