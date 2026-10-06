import { NextResponse } from "next/server"
import { db, billingMilestone, document, documentItem } from "@/lib/db"
import { and, count, eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { z } from "zod"
import { parseBody } from "@/lib/validation"
import { nextDocumentNumber } from "@/lib/documents"

const postSchema = z.union([
  z.object({ action: z.literal("invoice"), milestoneId: z.string().min(1, "Milestone ID is required") }),
  z.object({
    action: z.undefined().optional(),
    title: z.string().trim().min(1, "Title is required"),
    amount: z.coerce.number().positive("Amount must be more than 0"),
    percentage: z.coerce.number().nullish(),
    dueDate: z.string().nullish(),
  }),
])

const reorderSchema = z.object({
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    percentage: z.number().nullish(),
    amount: z.number().optional(),
    dueDate: z.string().nullish(),
    position: z.number().int().optional(),
  })),
})

// ── GET /api/studio/work/[id]/milestones ─────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const milestones = await db.query.billingMilestone.findMany({
    where: (t, { eq }) => eq(t.projectId, id),
    with: { invoice: { columns: { id: true, number: true, status: true, token: true } } },
    orderBy: (t, { asc }) => asc(t.position),
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
  const parsed = await parseBody(req, postSchema)
  if (parsed.error) return parsed.error
  const body = parsed.data

  // Handle conversion of a milestone to a draft invoice
  if (body.action === "invoice") {
    const { milestoneId } = body

    const milestone = await db.query.billingMilestone.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, milestoneId), eq(t.projectId, id)),
      with: { project: true, invoice: true },
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


    const invoiceNumber = await nextDocumentNumber("invoice")
    const token = nanoid(10)

    const invoice = await db.transaction(async (tx) => {
      const [inv] = await tx.insert(document).values({
        type: "invoice",
        number: invoiceNumber,
        clientId: milestone.project.clientId!,
        projectId: milestone.projectId,
        milestoneId: milestone.id,
        status: "draft",
        token,
      }).returning()

      await tx.insert(documentItem).values({
        documentId: inv.id,
        description: `Milestone: ${milestone.title}`,
        quantity: 1,
        rate: milestone.amount,
        amount: milestone.amount,
        flat: true,
        position: 0,
      })

      await tx.update(billingMilestone).set({ status: "invoiced" }).where(eq(billingMilestone.id, milestone.id))

      return inv
    })

    return NextResponse.json(invoice)
  }

  // Count existing milestones for position
  const [{ value: milestoneCount }] = await db
    .select({ value: count() })
    .from(billingMilestone)
    .where(eq(billingMilestone.projectId, id))

  const [inserted] = await db.insert(billingMilestone).values({
    projectId: id,
    title: body.title,
    percentage: body.percentage ?? null,
    amount: body.amount,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    status: "pending",
    position: milestoneCount,
  }).returning()
  const milestone = await db.query.billingMilestone.findFirst({
    where: (t, { eq }) => eq(t.id, inserted.id),
    with: { invoice: { columns: { id: true, number: true, status: true, token: true } } },
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
  const parsed = await parseBody(req, reorderSchema)
  if (parsed.error) return parsed.error
  const { milestones } = parsed.data

  await Promise.all(
    milestones.map((m) =>
      db.update(billingMilestone).set({
        ...(m.title !== undefined && { title: m.title }),
        ...(m.percentage !== undefined && { percentage: m.percentage }),
        ...(m.amount !== undefined && { amount: m.amount }),
        ...(m.dueDate !== undefined && { dueDate: m.dueDate ? new Date(m.dueDate) : null }),
        ...(m.position !== undefined && { position: m.position }),
      }).where(and(eq(billingMilestone.id, m.id), eq(billingMilestone.projectId, projectId)))
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

  const { id: projectId } = await params
  const { searchParams } = new URL(req.url)
  const milestoneId = searchParams.get("milestoneId")

  if (!milestoneId) {
    return NextResponse.json({ error: "Milestone ID is required" }, { status: 400 })
  }

  const milestone = await db.query.billingMilestone.findFirst({
    where: (t, { eq, and }) => and(eq(t.id, milestoneId), eq(t.projectId, projectId)),
    with: { invoice: true },
  })

  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
  }

  if (milestone.invoice && milestone.invoice.status === "paid") {
    return NextResponse.json({ error: "Cannot delete a milestone with a paid invoice" }, { status: 400 })
  }

  if (milestone.invoice) {
    await db.delete(document).where(eq(document.id, milestone.invoice.id))
  }

  await db.delete(billingMilestone).where(eq(billingMilestone.id, milestoneId))

  return NextResponse.json({ ok: true })
}
