import { db, blogPost } from "@/lib/db"
import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const posts = await db.select().from(blogPost).where(eq(blogPost.published, true)).orderBy(desc(blogPost.publishedAt))
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const [post] = await db.insert(blogPost).values({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt ?? "",
    content: body.content ?? "",
    coverImage: body.coverImage ?? null,
    tags: body.tags ?? [],
    published: body.published ?? false,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
  }).returning()
  return NextResponse.json(post, { status: 201 })
}
