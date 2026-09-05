import { NextResponse } from "next/server"
import { db, retainerContract } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

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

  const body = await req.json()

  if (!body.clientId || !body.title || !body.amount || !body.startDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const startDate = new Date(body.startDate)

  const [inserted] = await db.insert(retainerContract).values({
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

  const body = await req.json()
  const { id, ...fields } = body

  if (!id) {
    return NextResponse.json({ error: "Retainer ID is required" }, { status: 400 })
  }

  await db.update(retainerContract).set({
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
