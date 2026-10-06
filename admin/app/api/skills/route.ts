import { db, siteConfig } from "@/lib/db"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { skillCategories, techPills } from "@/data/skills"
import { z } from "zod"
import { parseBody } from "@/lib/validation"

const skillsSchema = z.object({
  techPills: z.array(z.string().trim().min(1)),
  skillCategories: z.array(z.object({
    id: z.string().min(1),
    title: z.string().trim().min(1, "Every category needs a title"),
    icon: z.string().min(1),
    skills: z.array(z.object({
      name: z.string().trim().min(1),
      level: z.enum(["Advanced", "Intermediate", "Learning"]),
    })),
  })),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  const parsed = await parseBody(request, skillsSchema)
  if (parsed.error) return parsed.error
  const body = parsed.data
  await db.insert(siteConfig)
    .values({ key: "skills", value: JSON.stringify(body) })
    .onConflictDoUpdate({ target: siteConfig.key, set: { value: JSON.stringify(body), updatedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
