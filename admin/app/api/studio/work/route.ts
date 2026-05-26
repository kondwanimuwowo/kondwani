import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const projects = await prisma.workProject.findMany({
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })

  const projectsWithDone = await Promise.all(
    projects.map(async (p) => {
      const doneCount = await prisma.workTask.count({
        where: { projectId: p.id, status: "done" },
      })
      return { ...p, doneTaskCount: doneCount }
    })
  )

  return NextResponse.json(projectsWithDone)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const project = await prisma.workProject.create({
    data: body,
    include: { client: { select: { id: true, name: true, company: true } } },
  })
  return NextResponse.json(project, { status: 201 })
}
