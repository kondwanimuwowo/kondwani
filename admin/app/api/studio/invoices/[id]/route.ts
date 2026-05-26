import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      client: true,
      project: { select: { id: true, title: true } },
      items: { orderBy: { position: "asc" } },
    },
  })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { items, ...body } = await request.json()

  await prisma.documentItem.deleteMany({ where: { documentId: id } })

  const doc = await prisma.document.update({
    where: { id },
    data: {
      ...body,
      items: {
        create: (items ?? []).map((item: { description: string; quantity: number; rate: number; flat?: boolean; position?: number }) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          flat: item.flat ?? false,
          amount: item.flat ? item.rate : item.quantity * item.rate,
          position: item.position ?? 0,
        })),
      },
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
      items: { orderBy: { position: "asc" } },
    },
  })
  return NextResponse.json(doc)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
