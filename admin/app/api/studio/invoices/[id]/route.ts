import { NextResponse } from "next/server"
import { db, document, documentItem } from "@/lib/db"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  const doc = await db.query.document.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      client: true,
      project: { columns: { id: true, title: true } },
      items: { orderBy: (t, { asc }) => asc(t.position) },
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

  await db.transaction(async (tx) => {
    await tx.delete(documentItem).where(eq(documentItem.documentId, id))

    await tx.update(document).set(body).where(eq(document.id, id))

    const rows = (items ?? []).map((item: { description: string; quantity: number; rate: number; flat?: boolean; position?: number }) => ({
      documentId: id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      flat: item.flat ?? false,
      amount: item.flat ? item.rate : item.quantity * item.rate,
      position: item.position ?? 0,
    }))
    if (rows.length > 0) await tx.insert(documentItem).values(rows)
  })

  const doc = await db.query.document.findFirst({
    where: (t, { eq }) => eq(t.id, id),
    with: {
      client: { columns: { id: true, name: true, company: true } },
      project: { columns: { id: true, title: true } },
      items: { orderBy: (t, { asc }) => asc(t.position) },
    },
  })
  return NextResponse.json(doc)
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(document).where(eq(document.id, id))
  return NextResponse.json({ ok: true })
}
