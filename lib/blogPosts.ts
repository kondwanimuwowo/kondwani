import { and, desc, eq, ne } from "drizzle-orm"
import { db, blogPost } from "@/lib/db"
import { BLOG_SITE, MAIN_SITE } from "@/lib/blogSite"

export interface PostSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: string | null
  category: string
  publishedAt: Date | null
  readingMinutes: number
}

const summaryColumns = {
  id: blogPost.id,
  title: blogPost.title,
  slug: blogPost.slug,
  excerpt: blogPost.excerpt,
  coverImage: blogPost.coverImage,
  category: blogPost.category,
  publishedAt: blogPost.publishedAt,
  content: blogPost.content,
}

export function readingMinutes(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

// Tech posts belong to the portfolio; everything else belongs to this blog
export function canonicalUrl(post: { slug: string; category: string }) {
  return post.category === "tech" ? `${MAIN_SITE}/blog/${post.slug}` : `${BLOG_SITE}/${post.slug}`
}

export function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date) : ""
}

function toSummary({ content, ...post }: Omit<PostSummary, "readingMinutes"> & { content: string }): PostSummary {
  return { ...post, readingMinutes: readingMinutes(content) }
}

export async function getPosts(category?: string): Promise<PostSummary[]> {
  try {
    const rows = await db
      .select(summaryColumns)
      .from(blogPost)
      .where(category ? and(eq(blogPost.published, true), eq(blogPost.category, category)) : eq(blogPost.published, true))
      .orderBy(desc(blogPost.publishedAt))
    return rows.map(toSummary)
  } catch (e) {
    console.error("Loading posts failed", e)
    return []
  }
}

// Same category first, topped up with the newest posts from any category
export async function getRelated(slug: string, category: string, limit = 3): Promise<PostSummary[]> {
  try {
    const sameCategory = await db
      .select(summaryColumns)
      .from(blogPost)
      .where(and(eq(blogPost.published, true), eq(blogPost.category, category), ne(blogPost.slug, slug)))
      .orderBy(desc(blogPost.publishedAt))
      .limit(limit)
    if (sameCategory.length >= limit) return sameCategory.map(toSummary)
    const others = await db
      .select(summaryColumns)
      .from(blogPost)
      .where(and(eq(blogPost.published, true), ne(blogPost.category, category)))
      .orderBy(desc(blogPost.publishedAt))
      .limit(limit - sameCategory.length)
    return [...sameCategory, ...others].map(toSummary)
  } catch {
    return []
  }
}
