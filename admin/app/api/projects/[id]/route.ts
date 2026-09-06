import { db, project as projectTable } from "@/lib/db"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const project = await db.query.project.findFirst({ where: (t, { eq }) => eq(t.id, id) })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const [project] = await db.update(projectTable).set(body).where(eq(projectTable.id, id)).returning()
  return NextResponse.json(project)
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(projectTable).where(eq(projectTable.id, id))
  return NextResponse.json({ ok: true })
}
