import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const jobs = await prisma.jobApplication.findMany({ orderBy: { appliedAt: "desc" } })
  return NextResponse.json(jobs)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const job = await prisma.jobApplication.create({
    data: { ...body, appliedAt: new Date(body.appliedAt) },
  })
  return NextResponse.json(job, { status: 201 })
}
