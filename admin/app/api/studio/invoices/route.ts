import { NextResponse } from "next/server"
import { db, document, documentItem } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { z } from "zod"
import { writable } from "@/lib/db/writable"
import { parseBody, lineItems } from "@/lib/validation"
import { nextDocumentNumber, toItemRows } from "@/lib/documents"

const createSchema = z.looseObject({
  type: z.enum(["invoice", "quote"]),
  clientId: z.string().min(1, "Choose a client"),
  items: lineItems.optional(),
})

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

  const parsed = await parseBody(request, createSchema)
  if (parsed.error) return parsed.error
  const { items, ...body } = parsed.data
  const number = await nextDocumentNumber(body.type)
  const token = nanoid(10)

  const docId = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(document).values({
      ...writable(document, body),
      type: body.type,
      clientId: body.clientId,
      number,
      token,
    }).returning()

    const rows = toItemRows(inserted.id, items ?? [])
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
