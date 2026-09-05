import { db, caseStudy } from "@/lib/db"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const studies = await db.query.caseStudy.findMany({ orderBy: (t, { desc }) => desc(t.createdAt) })
  return NextResponse.json(studies)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const [study] = await db.insert(caseStudy).values(body).returning()
  return NextResponse.json(study, { status: 201 })
}
