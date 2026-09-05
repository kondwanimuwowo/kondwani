import { db, jobApplication } from "@/lib/db"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const jobs = await db.query.jobApplication.findMany({ orderBy: (t, { desc }) => desc(t.appliedAt) })
  return NextResponse.json(jobs)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const [job] = await db.insert(jobApplication).values({ ...body, appliedAt: new Date(body.appliedAt) }).returning()
  return NextResponse.json(job, { status: 201 })
}
