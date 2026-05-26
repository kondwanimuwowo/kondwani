import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

// ── GET /api/studio/retainers ────────────────────────────────────────────────
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  const retainers = await prisma.retainerContract.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      client: { select: { id: true, name: true, company: true, email: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(retainers)
}

// ── POST /api/studio/retainers ───────────────────────────────────────────────
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (!body.clientId || !body.title || !body.amount || !body.startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const startDate = new Date(body.startDate)
  
  const retainer = await prisma.retainerContract.create({
    data: {
      clientId: body.clientId,
      projectId: body.projectId || null,
      title: body.title,
      amount: parseFloat(body.amount),
      currency: body.currency || "USD",
      frequency: body.frequency || "monthly",
      startDate,
      endDate: body.endDate ? new Date(body.endDate) : null,
      status: body.status || "active",
      nextInvoiceAt: body.nextInvoiceAt ? new Date(body.nextInvoiceAt) : startDate,
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json(retainer, { status: 201 })
}

// ── PUT /api/studio/retainers ────────────────────────────────────────────────
export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ...fields } = body

  if (!id) {
    return NextResponse.json({ error: "Retainer ID is required" }, { status: 400 })
  }

  const updated = await prisma.retainerContract.update({
    where: { id },
    data: {
      ...(fields.title !== undefined && { title: fields.title }),
      ...(fields.amount !== undefined && { amount: parseFloat(fields.amount) }),
      ...(fields.currency !== undefined && { currency: fields.currency }),
      ...(fields.frequency !== undefined && { frequency: fields.frequency }),
      ...(fields.startDate !== undefined && { startDate: new Date(fields.startDate) }),
      ...(fields.endDate !== undefined && { endDate: fields.endDate ? new Date(fields.endDate) : null }),
      ...(fields.status !== undefined && { status: fields.status }),
      ...(fields.nextInvoiceAt !== undefined && { nextInvoiceAt: new Date(fields.nextInvoiceAt) }),
      ...(fields.lastInvoicedAt !== undefined && { lastInvoicedAt: fields.lastInvoicedAt ? new Date(fields.lastInvoicedAt) : null }),
      ...(fields.projectId !== undefined && { projectId: fields.projectId || null }),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json(updated)
}

// ── DELETE /api/studio/retainers ─────────────────────────────────────────────
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Retainer ID is required" }, { status: 400 })
  }

  await prisma.retainerContract.delete({
    where: { id },
  })

  return NextResponse.json({ ok: true })
}
