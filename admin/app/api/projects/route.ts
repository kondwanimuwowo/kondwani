import { db, project as projectTable } from "@/lib/db"
import { writable, dbErrorMessage } from "@/lib/db/writable"
import { max } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const projects = await db.query.project.findMany({ orderBy: (t, { asc }) => [asc(t.order), asc(t.createdAt)] })
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  try {
    // New projects always go to the end of the list; order is only changed through /api/projects/reorder
    const [{ last }] = await db.select({ last: max(projectTable.order) }).from(projectTable)
    const [project] = await db.insert(projectTable).values({ ...writable(projectTable, body), order: (last ?? 0) + 1 }).returning()
    return NextResponse.json(project, { status: 201 })
  } catch (e) {
    console.error("Project create failed", e)
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 })
  }
}
