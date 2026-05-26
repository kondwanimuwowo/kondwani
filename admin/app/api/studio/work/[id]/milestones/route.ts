import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

// ── GET /api/studio/work/[id]/milestones ─────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const milestones = await prisma.billingMilestone.findMany({
    where: { projectId: id },
    include: { invoice: { select: { id: true, number: true, status: true, token: true } } },
    orderBy: { position: "asc" },
  })
  return NextResponse.json(milestones)
}

// ── POST /api/studio/work/[id]/milestones ────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Handle conversion of a milestone to a draft invoice
  if (body.action === "invoice") {
    const { milestoneId } = body
    if (!milestoneId) {
      return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 })
    }

    const milestone = await prisma.billingMilestone.findUnique({
      where: { id: milestoneId },
      include: { project: true, invoice: true }
    })

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    if (milestone.invoice) {
      return NextResponse.json({ error: "Milestone already invoiced" }, { status: 400 })
    }
    if (!milestone.project.clientId) {
      return NextResponse.json({ error: "Project has no client assigned" }, { status: 400 })
    }

    const nextNumber = async (type: "invoice" | "quote") => {
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

    const invoiceNumber = await nextNumber("invoice")
    const token = nanoid(10)

    const invoice = await prisma.document.create({
      data: {
        type: "invoice",
        number: invoiceNumber,
        clientId: milestone.project.clientId,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        status: "draft",
        token,
        items: {
          create: [{
            description: `Milestone: ${milestone.title}`,
            quantity: 1,
            rate: milestone.amount,
            amount: milestone.amount,
            flat: true,
            position: 0
          }]
        }
      }
    })

    await prisma.billingMilestone.update({
      where: { id: milestone.id },
      data: { status: "invoiced" }
    })

    return NextResponse.json(invoice)
  }

  // Count existing milestones for position
  const count = await prisma.billingMilestone.count({ where: { projectId: id } })

  const milestone = await prisma.billingMilestone.create({
    data: {
      projectId: id,
      title: body.title,
      percentage: body.percentage ?? null,
      amount: body.amount,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: "pending",
      position: count,
    },
    include: { invoice: { select: { id: true, number: true, status: true, token: true } } },
  })
  return NextResponse.json(milestone, { status: 201 })
}

// ── PUT /api/studio/work/[id]/milestones ─────────────────────────────────────
// Bulk reorder or update multiple milestones at once
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const { milestones } = await req.json() as {
    milestones: Array<{
      id: string
      title?: string
      percentage?: number | null
      amount?: number
      dueDate?: string | null
      position?: number
    }>
  }

  await Promise.all(
    milestones.map((m) =>
      prisma.billingMilestone.update({
        where: { id: m.id, projectId },
        data: {
          ...(m.title !== undefined && { title: m.title }),
          ...(m.percentage !== undefined && { percentage: m.percentage }),
          ...(m.amount !== undefined && { amount: m.amount }),
          ...(m.dueDate !== undefined && { dueDate: m.dueDate ? new Date(m.dueDate) : null }),
          ...(m.position !== undefined && { position: m.position }),
        },
      })
    )
  )
  return NextResponse.json({ ok: true })
}

// ── DELETE /api/studio/work/[id]/milestones ──────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const milestoneId = searchParams.get("milestoneId")

  if (!milestoneId) {
    return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 })
  }

  const milestone = await prisma.billingMilestone.findUnique({
    where: { id: milestoneId },
    include: { invoice: true }
  })

  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
  }

  if (milestone.invoice && milestone.invoice.status === "paid") {
    return NextResponse.json({ error: "Cannot delete a milestone with a paid invoice" }, { status: 400 })
  }

  if (milestone.invoice) {
    await prisma.document.delete({
      where: { id: milestone.invoice.id }
    })
  }

  await prisma.billingMilestone.delete({
    where: { id: milestoneId }
  })

  return NextResponse.json({ ok: true })
}
