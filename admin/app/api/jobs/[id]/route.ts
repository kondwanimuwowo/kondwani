import { db, jobApplication } from "@/lib/db"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const job = await db.query.jobApplication.findFirst({ where: (t, { eq }) => eq(t.id, id) })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(job)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const [job] = await db.update(jobApplication)
    .set({ ...body, appliedAt: body.appliedAt ? new Date(body.appliedAt) : undefined })
    .where(eq(jobApplication.id, id))
    .returning()
  return NextResponse.json(job)
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(jobApplication).where(eq(jobApplication.id, id))
  return NextResponse.json({ ok: true })
}
