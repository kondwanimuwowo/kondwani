import { db, siteConfig } from "@/lib/db"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { skillCategories, techPills } from "@/data/skills"

export async function GET() {
  const config = await db.query.siteConfig.findFirst({ where: (t, { eq }) => eq(t.key, "skills") })
  if (config) {
    return NextResponse.json(JSON.parse(config.value))
  }
  return NextResponse.json({ skillCategories, techPills })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  await db.insert(siteConfig)
    .values({ key: "skills", value: JSON.stringify(body) })
    .onConflictDoUpdate({ target: siteConfig.key, set: { value: JSON.stringify(body), updatedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
