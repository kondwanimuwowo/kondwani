import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  })
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const post = await prisma.blogPost.create({
    data: {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt ?? "",
      content: body.content ?? "",
      coverImage: body.coverImage ?? null,
      tags: body.tags ?? [],
      published: body.published ?? false,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
