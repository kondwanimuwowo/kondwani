import { NextResponse } from "next/server"
import { db, workProject } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const projects = await db.query.workProject.findMany({
    with: {
      client: { columns: { id: true, name: true, company: true } },
      tasks: { columns: { id: true, status: true } },
    },
    orderBy: (t, { asc, desc }) => [asc(t.order), desc(t.createdAt)],
  })

  const projectsWithDone = projects.map((p) => {
    const { tasks, ...rest } = p
    return {
      ...rest,
      _count: { tasks: tasks.length },
      doneTaskCount: tasks.filter((t) => t.status === "done").length,
    }
  })

  return NextResponse.json(projectsWithDone)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const [inserted] = await db.insert(workProject).values(body).returning()
  const project = await db.query.workProject.findFirst({
    where: (t, { eq }) => eq(t.id, inserted.id),
    with: { client: { columns: { id: true, name: true, company: true } } },
  })
  return NextResponse.json(project, { status: 201 })
}
