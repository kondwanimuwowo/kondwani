import { db } from "@/lib/db"
import { renderOgCard, type OgCard } from "@/lib/og"
import { staticOgUrl, type StaticOgPage } from "@/lib/seo"

type Params = { params: Promise<{ type: string; slug: string }> }

function joinMeta(...parts: (string | number | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ") || null
}

async function resolveCard(type: string, slug: string): Promise<OgCard | null> {
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

const STATIC_PAGES: StaticOgPage[] = ["home", "projects", "beyond-code", "contact", "blog"]

export async function GET(_request: Request, { params }: Params) {
  const { type, slug } = await params
  if (type === "page") {
    const page = STATIC_PAGES.includes(slug as StaticOgPage) ? (slug as StaticOgPage) : "home"
    return Response.redirect(staticOgUrl(page), 301)
  }

  let card: OgCard | null = null
  try {
    card = await resolveCard(type, decodeURIComponent(slug))
  } catch (e) {
    console.error("OG card lookup failed", e)
  }
  // A missing record or one without a screenshot falls back to the home image, so a share never shows a broken card
  const response = card ? await renderOgCard(card) : null
  return response ?? Response.redirect(staticOgUrl("home"), 302)
}
