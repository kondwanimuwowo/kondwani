import { db } from "@/lib/db"

// Next INV-/QUO- number. Compares numerically, so INV-1000 follows INV-999.
export async function nextDocumentNumber(type: "invoice" | "quote") {
  const prefix = type === "invoice" ? "INV" : "QUO"
  const rows = await db.query.document.findMany({
    where: (t, { eq }) => eq(t.type, type),
    columns: { number: true },
  })
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.number.split("-")[1] ?? "0", 10) || 0), 0)
  return `${prefix}-${String(max + 1).padStart(3, "0")}`
}

export function toItemRows(documentId: string, items: { description: string; quantity: number; rate: number; flat?: boolean; position?: number }[]) {
  return items.map((item, i) => ({
    documentId,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    flat: item.flat ?? false,
    amount: item.flat ? item.rate : item.quantity * item.rate,
    position: item.position ?? i,
  }))
}
