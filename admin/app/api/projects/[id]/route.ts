import { db, project as projectTable } from "@/lib/db"
import { writable, dbErrorMessage } from "@/lib/db/writable"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
  try {
    // Order is only changed through /api/projects/reorder
    const values = writable(projectTable, body)
    delete values.order
    const [project] = await db.update(projectTable).set(values).where(eq(projectTable.id, id)).returning()
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(project)
  } catch (e) {
    console.error("Project update failed", e)
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(projectTable).where(eq(projectTable.id, id))
  return NextResponse.json({ ok: true })
}
