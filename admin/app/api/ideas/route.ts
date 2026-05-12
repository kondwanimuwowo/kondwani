import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const ideas = await prisma.idea.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(ideas)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const idea = await prisma.idea.create({ data: body })
  return NextResponse.json(idea, { status: 201 })
}
