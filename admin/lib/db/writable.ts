import { getTableColumns, type InferInsertModel, type Table } from "drizzle-orm"

// Surfaces the common Postgres constraint failures in plain words for the admin UI.
export function dbErrorMessage(e: unknown): string {
  const err = (e as { cause?: { code?: string; detail?: string } })?.cause ?? (e as { code?: string; detail?: string })
  if (err?.code === "23505") return `Already exists: ${err.detail ?? "duplicate value"}`
  if (err?.code === "23502") return "A required field is missing"
  return "Database error"
}

const READ_ONLY = new Set(["id", "createdAt", "updatedAt"])

// Request bodies often echo back the full row (id, timestamps as ISO strings,
// joined relations). Passing that straight to drizzle throws on timestamp
// columns, so keep only real writable columns and revive date strings.
export function writable<T extends Table>(table: T, body: unknown): InferInsertModel<T> {
  const out: Record<string, unknown> = {}
  if (!body || typeof body !== "object") return out as InferInsertModel<T>

  const columns = getTableColumns(table)
  for (const [key, value] of Object.entries(body)) {
    const column = columns[key]
    if (!column || READ_ONLY.has(key) || value === undefined) continue
    if (column.dataType === "date" && typeof value === "string") {
      if (value) out[key] = new Date(value)
      continue
    }
    out[key] = value
  }
  return out as InferInsertModel<T>
}
