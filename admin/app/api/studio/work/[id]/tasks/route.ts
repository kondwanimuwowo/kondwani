import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const tasks = await prisma.workTask.findMany({
    where: { projectId: id, parentId: null },
    include: { subtasks: { orderBy: { position: "asc" } } },
    orderBy: { position: "asc" },
  })
  return NextResponse.json(tasks)
}

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const body = await request.json()

  const maxPos = await prisma.workTask.aggregate({
    where: { projectId, status: body.status ?? "todo", parentId: null },
    _max: { position: true },
  })

  const task = await prisma.workTask.create({
    data: { ...body, projectId, position: (maxPos._max.position ?? 0) + 1 },
    include: { subtasks: true },
  })
  return NextResponse.json(task, { status: 201 })
}
