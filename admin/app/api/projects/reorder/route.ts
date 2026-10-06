import { db, project as projectTable } from "@/lib/db"
import { dbErrorMessage } from "@/lib/db/writable"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Takes every project id in display order and renumbers them 1..n, so orders stay unique
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json()
  const ids = (body as { ids?: unknown })?.ids
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every(id => typeof id === "string")) {
    return NextResponse.json({ error: "Expected a list of project ids" }, { status: 400 })
  }

  try {
    await db.transaction(async (tx) => {
      for (const [index, id] of (ids as string[]).entries()) {
        await tx.update(projectTable).set({ order: index + 1 }).where(eq(projectTable.id, id))
      }
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Project reorder failed", e)
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 })
  }
}
