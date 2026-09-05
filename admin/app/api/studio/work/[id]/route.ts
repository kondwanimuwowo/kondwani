import { NextResponse } from "next/server"
import { db, workProject } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const project = await db.query.workProject.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      client: true,
      tasks: {
        where: (t, { isNull }) => isNull(t.parentId),
        with: { subtasks: true },
        orderBy: (t, { asc }) => asc(t.position),
      },
      documents: {
        with: { items: true },
        orderBy: (t, { desc }) => desc(t.createdAt),
      },
    },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const [project] = await db.update(workProject).set(body).where(eq(workProject.id, id)).returning()
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(workProject).where(eq(workProject.id, id))
  return NextResponse.json({ ok: true })
}
