import { db } from "@/lib/db"
import { renderOgCard, type OgCard } from "@/lib/og"
import { PAGE_CARDS, type PageCardKey } from "@/data/site"

type Params = { params: Promise<{ type: string; slug: string }> }

function joinMeta(...parts: (string | number | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ") || null
}

async function resolveCard(type: string, slug: string): Promise<OgCard | null> {
  if (type === "page") {
    return slug in PAGE_CARDS ? PAGE_CARDS[slug as PageCardKey] : null
  }

  if (type === "project") {
    const p = await db.query.project.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
    if (!p) return null
    return {
      title: p.title,
      subtitle: p.excerpt ?? p.description,
      meta: joinMeta(p.category, p.year),
      image: p.imageUrl ?? p.gallery?.[0] ?? null,
    }
  }

  if (type === "case-study") {
    const cs = await db.query.caseStudy.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
    if (!cs) return null
    return { title: cs.title, subtitle: cs.excerpt, meta: joinMeta("Case study", cs.year), image: cs.coverImage }
  }

  if (type === "blog") {
    const post = await db.query.blogPost.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
    if (!post) return null
    const date = post.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    return { title: post.title, subtitle: post.excerpt, meta: joinMeta("Blog", date), image: post.coverImage }
  }

  return null
}

export async function GET(_request: Request, { params }: Params) {
  const { type, slug } = await params
  let card: OgCard | null = null
  try {
    card = await resolveCard(type, decodeURIComponent(slug))
  } catch (e) {
    console.error("OG card lookup failed", e)
  }
  // A missing record still gets the site card, so a shared link never shows a broken image
  return renderOgCard(card ?? PAGE_CARDS.home)
}
