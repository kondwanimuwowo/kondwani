import { db, blogPost } from "@/lib/db"
import { writable, dbErrorMessage } from "@/lib/db/writable"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
  const data = writable(blogPost, await request.json())
  delete data.publishedAt

  try {
    const current = await db.query.blogPost.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      columns: { publishedAt: true },
    })
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Publishing stamps the date once; unpublishing clears it.
    const publishedAt = data.published === undefined
      ? undefined
      : data.published ? (current.publishedAt ?? new Date()) : null

    const [post] = await db.update(blogPost)
      .set({ ...data, ...(publishedAt !== undefined && { publishedAt }) })
      .where(eq(blogPost.id, id))
      .returning()
    return NextResponse.json(post)
  } catch (e) {
    console.error("Post update failed", e)
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.delete(blogPost).where(eq(blogPost.id, id))
  return NextResponse.json({ ok: true })
}
