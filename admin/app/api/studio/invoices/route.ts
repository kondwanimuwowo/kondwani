import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

async function nextNumber(type: "invoice" | "quote") {
  const prefix = type === "invoice" ? "INV" : "QUO"
  const last = await prisma.document.findFirst({
    where: { type },
    orderBy: { number: "desc" },
    select: { number: true },
  })
  if (!last) return `${prefix}-001`
  const n = parseInt(last.number.split("-")[1] ?? "0", 10)
  return `${prefix}-${String(n + 1).padStart(3, "0")}`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const docs = await prisma.document.findMany({
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
      items: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(docs)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { items, ...body } = await request.json()
  const number = await nextNumber(body.type)
  const token = nanoid(10)

  const doc = await prisma.document.create({
    data: {
      ...body,
      number,
      token,
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
  return NextResponse.json(doc, { status: 201 })
}
