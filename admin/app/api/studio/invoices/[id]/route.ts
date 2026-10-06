import { NextResponse } from "next/server"
import { db, document, documentItem } from "@/lib/db"
import { writable } from "@/lib/db/writable"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { parseBody, lineItems } from "@/lib/validation"
import { toItemRows } from "@/lib/documents"

const updateSchema = z.looseObject({ items: lineItems.optional() })

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
  const parsed = await parseBody(request, updateSchema)
  if (parsed.error) return parsed.error
  const { items, ...body } = parsed.data

  await db.transaction(async (tx) => {
    const fields = writable(document, body)
    if (Object.keys(fields).length > 0) await tx.update(document).set(fields).where(eq(document.id, id))

    // Only replace line items when the caller sent them; a status change must not wipe them.
    if (items) {
      await tx.delete(documentItem).where(eq(documentItem.documentId, id))
      const rows = toItemRows(id, items)
      if (rows.length > 0) await tx.insert(documentItem).values(rows)
    }
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
