import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const project = await prisma.project.create({ data: body })
  return NextResponse.json(project, { status: 201 })
}
