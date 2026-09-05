import { NextResponse } from "next/server"
import { db, workTask } from "@/lib/db"
import { and, eq, isNull, max } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const tasks = await db.query.workTask.findMany({
    where: (t, { eq, isNull, and }) => and(eq(t.projectId, id), isNull(t.parentId)),
    with: { subtasks: { orderBy: (t, { asc }) => asc(t.position) } },
    orderBy: (t, { asc }) => asc(t.position),
  })
  return NextResponse.json(tasks)
}

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const body = await request.json()

  const [{ maxPosition }] = await db
    .select({ maxPosition: max(workTask.position) })
    .from(workTask)
    .where(and(eq(workTask.projectId, projectId), eq(workTask.status, body.status ?? "todo"), isNull(workTask.parentId)))

  const [inserted] = await db.insert(workTask).values({
    ...body,
    projectId,
    position: (maxPosition ?? 0) + 1,
  }).returning()
  const task = await db.query.workTask.findFirst({
    where: (t, { eq }) => eq(t.id, inserted.id),
    with: { subtasks: true },
  })
  return NextResponse.json(task, { status: 201 })
}
