import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const client = await prisma.client.create({ data: body })
  return NextResponse.json(client, { status: 201 })
}
