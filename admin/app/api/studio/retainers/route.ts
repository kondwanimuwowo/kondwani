import { NextResponse } from "next/server"
import { db, retainerContract } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { parseBody } from "@/lib/validation"

const frequency = z.enum(["monthly", "quarterly", "annually"])
const date = z.string().min(1)

const createSchema = z.object({
  clientId: z.string({ error: "The project needs a client first" }).min(1, "The project needs a client first"),
  projectId: z.string().nullish(),
  title: z.string().trim().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be more than 0"),
  currency: z.string().optional(),
  frequency: frequency.optional(),
  startDate: date,
  endDate: date.nullish(),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  nextInvoiceAt: date.optional(),
})

const updateSchema = z.object({
  id: z.string().min(1, "Retainer ID is required"),
  title: z.string().trim().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().optional(),
  frequency: frequency.optional(),
  startDate: date.optional(),
  endDate: date.nullish(),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  nextInvoiceAt: date.optional(),
  lastInvoicedAt: date.nullish(),
  projectId: z.string().nullish(),
})

// ── GET /api/studio/retainers ────────────────────────────────────────────────
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")

  const retainers = await db.query.retainerContract.findMany({
    where: projectId ? (t, { eq }) => eq(t.projectId, projectId) : undefined,
    with: {
      client: { columns: { id: true, name: true, company: true, email: true } },
      project: { columns: { id: true, title: true } },
    },
    orderBy: (t, { desc }) => desc(t.createdAt),
  })
  return NextResponse.json(retainers)
}

// ── POST /api/studio/retainers ───────────────────────────────────────────────
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, createSchema)
  if (parsed.error) return parsed.error
  const body = parsed.data

  const startDate = new Date(body.startDate)

  const [inserted] = await db.insert(retainerContract).values({
    clientId: body.clientId,
    projectId: body.projectId || null,
    title: body.title,
    amount: body.amount,
    currency: body.currency || "USD",
    frequency: body.frequency || "monthly",
    startDate,
    endDate: body.endDate ? new Date(body.endDate) : null,
    status: body.status || "active",
    nextInvoiceAt: body.nextInvoiceAt ? new Date(body.nextInvoiceAt) : startDate,
  }).returning()

  const retainer = await db.query.retainerContract.findFirst({
    where: (t, { eq }) => eq(t.id, inserted.id),
    with: {
      client: { columns: { id: true, name: true, company: true } },
      project: { columns: { id: true, title: true } },
    },
  })

  return NextResponse.json(retainer, { status: 201 })
}

// ── PUT /api/studio/retainers ────────────────────────────────────────────────
export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, updateSchema)
  if (parsed.error) return parsed.error
  const { id, ...fields } = parsed.data

  await db.update(retainerContract).set({
    ...(fields.title !== undefined && { title: fields.title }),
    ...(fields.amount !== undefined && { amount: fields.amount }),
    ...(fields.currency !== undefined && { currency: fields.currency }),
    ...(fields.frequency !== undefined && { frequency: fields.frequency }),
    ...(fields.startDate !== undefined && { startDate: new Date(fields.startDate) }),
    ...(fields.endDate !== undefined && { endDate: fields.endDate ? new Date(fields.endDate) : null }),
    ...(fields.status !== undefined && { status: fields.status }),
    ...(fields.nextInvoiceAt !== undefined && { nextInvoiceAt: new Date(fields.nextInvoiceAt) }),
    ...(fields.lastInvoicedAt !== undefined && { lastInvoicedAt: fields.lastInvoicedAt ? new Date(fields.lastInvoicedAt) : null }),
    ...(fields.projectId !== undefined && { projectId: fields.projectId || null }),
  }).where(eq(retainerContract.id, id))

  const updated = await db.query.retainerContract.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      client: { columns: { id: true, name: true, company: true } },
      project: { columns: { id: true, title: true } },
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

  await db.delete(retainerContract).where(eq(retainerContract.id, id))

  return NextResponse.json({ ok: true })
}
