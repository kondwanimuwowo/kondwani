import { db, project as projectTable } from "@/lib/db"
import { writable, dbErrorMessage } from "@/lib/db/writable"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const projects = await db.query.project.findMany({ orderBy: (t, { asc }) => asc(t.order) })
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  try {
    const [project] = await db.insert(projectTable).values(writable(projectTable, body)).returning()
    return NextResponse.json(project, { status: 201 })
  } catch (e) {
    console.error("Project create failed", e)
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 })
  }
}
