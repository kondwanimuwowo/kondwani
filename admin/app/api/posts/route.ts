import { db, blogPost } from "@/lib/db"
import { writable, dbErrorMessage } from "@/lib/db/writable"
import { desc } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const posts = await db
    .select({
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt,
      coverImage: blogPost.coverImage,
      category: blogPost.category,
      tags: blogPost.tags,
      published: blogPost.published,
      publishedAt: blogPost.publishedAt,
      createdAt: blogPost.createdAt,
      updatedAt: blogPost.updatedAt,
    })
    .from(blogPost)
    .orderBy(desc(blogPost.createdAt))
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = writable(blogPost, await request.json())
  if (!data.title?.trim() || !data.slug?.trim()) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 })
  }
  try {
    const [post] = await db.insert(blogPost).values({
      ...data,
      excerpt: data.excerpt ?? "",
      content: data.content ?? "",
      tags: data.tags ?? [],
      publishedAt: data.published ? new Date() : null,
    }).returning()
    return NextResponse.json(post, { status: 201 })
  } catch (e) {
    console.error("Post create failed", e)
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 })
  }
}
