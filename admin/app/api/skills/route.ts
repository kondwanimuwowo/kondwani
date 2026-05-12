import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { skillCategories, techPills } from "@/data/skills"

export async function GET() {
  const config = await prisma.siteConfig.findFirst({ where: { key: "skills" } })
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
  await prisma.siteConfig.upsert({
    where: { key: "skills" },
    create: { key: "skills", value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) },
  })
  return NextResponse.json({ ok: true })
}
