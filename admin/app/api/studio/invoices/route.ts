import { NextResponse } from "next/server"
import { db, document, documentItem } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

async function nextNumber(type: "invoice" | "quote") {
  const prefix = type === "invoice" ? "INV" : "QUO"
  const last = await db.query.document.findFirst({
    where: (t, { eq }) => eq(t.type, type),
    orderBy: (t, { desc }) => desc(t.number),
    columns: { number: true },
  })
  if (!last) return `${prefix}-001`
  const n = parseInt(last.number.split("-")[1] ?? "0", 10)
  return `${prefix}-${String(n + 1).padStart(3, "0")}`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const docs = await db.query.document.findMany({
    with: {
      client: { columns: { id: true, name: true, company: true } },
      project: { columns: { id: true, title: true } },
      items: { orderBy: (t, { asc }) => asc(t.position) },
    },
    orderBy: (t, { desc }) => desc(t.createdAt),
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

  const docId = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(document).values({
      ...body,
      number,
      token,
    }).returning()

    const rows = (items ?? []).map((item: { description: string; quantity: number; rate: number; flat?: boolean; position?: number }) => ({
      documentId: inserted.id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      flat: item.flat ?? false,
      amount: item.flat ? item.rate : item.quantity * item.rate,
      position: item.position ?? 0,
    }))
    if (rows.length > 0) await tx.insert(documentItem).values(rows)

    return inserted.id
  })

  const doc = await db.query.document.findFirst({
    where: (t, { eq }) => eq(t.id, docId),
    with: {
      client: { columns: { id: true, name: true, company: true } },
      project: { columns: { id: true, title: true } },
      items: { orderBy: (t, { asc }) => asc(t.position) },
    },
  })
  return NextResponse.json(doc, { status: 201 })
}
