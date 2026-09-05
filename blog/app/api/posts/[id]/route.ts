import { db, blogPost } from "@/lib/db"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const post = await db.query.blogPost.findFirst({ where: (t, { eq }) => eq(t.id, id) })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.slug !== undefined) data.slug = body.slug
  if (body.excerpt !== undefined) data.excerpt = body.excerpt
  if (body.content !== undefined) data.content = body.content
  if (body.coverImage !== undefined) data.coverImage = body.coverImage
  if (body.tags !== undefined) data.tags = body.tags
  if (body.published !== undefined) data.published = body.published
  if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null

  const [post] = await db.update(blogPost).set(data).where(eq(blogPost.id, id)).returning()
  return NextResponse.json(post)
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(blogPost).where(eq(blogPost.id, id))
  return NextResponse.json({ ok: true })
}
