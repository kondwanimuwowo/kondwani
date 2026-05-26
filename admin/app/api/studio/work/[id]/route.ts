import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const project = await prisma.workProject.findUnique({
    where: { id },
    include: {
      client: true,
      tasks: {
        where: { parentId: null },
        include: { subtasks: true },
        orderBy: { position: "asc" },
      },
      documents: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const project = await prisma.workProject.update({ where: { id }, data: body })
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.workProject.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
