import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import { db } from "@/lib/db"
import { categoryLabel } from "@/data/blogCategories"
import { canonicalUrl, formatDate, getRelated, readingMinutes } from "@/lib/posts"
import { MAIN_SITE, TWITTER } from "@/lib/site"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { AuthorBox } from "@/components/blog/AuthorBox"
import { PostCard } from "@/components/blog/PostCard"

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  try {
    return await db.query.blogPost.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
  } catch {
    return undefined
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  // Tech posts point search engines at their copy on the portfolio
  const url = canonicalUrl(post)
  const images = [{ url: `${MAIN_SITE}/og/blog/${slug}?v=${post.updatedAt.getTime()}`, width: 1200, height: 630, alt: post.title }]
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${post.title}, Kondwani Muwowo`,
      description: post.excerpt,
      url,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: categoryLabel(post.category),
      images,
    },
    twitter: { card: "summary_large_image", creator: TWITTER, site: TWITTER, images },
  }
}

export async function generateStaticParams() {
  try {
    const posts = await db.query.blogPost.findMany({ where: (t, { eq }) => eq(t.published, true), columns: { slug: true } })
    return posts.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const related = await getRelated(slug, post.category)
  const minutes = readingMinutes(post.content)
  const url = canonicalUrl(post)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    image: post.coverImage ?? `${MAIN_SITE}/og/blog/${slug}`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    articleSection: categoryLabel(post.category),
    wordCount: post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length,
    author: { "@type": "Person", "@id": `${MAIN_SITE}/#person`, name: "Kondwani Muwowo", url: MAIN_SITE },
    publisher: { "@type": "Person", "@id": `${MAIN_SITE}/#person`, name: "Kondwani Muwowo", url: MAIN_SITE },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className={`bg-primary pt-40 ${post.coverImage ? "pb-32 md:pb-48" : "pb-24"}`}>
        <AnimateIn className="container-custom max-w-3xl text-center">
          <Link
            href={`/category/${post.category}`}
            className="mb-8 inline-flex rounded-full bg-primary-dark px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {categoryLabel(post.category)}
          </Link>
          <h1 className="mb-6 text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">{post.title}</h1>
          <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-primary-tint">{post.excerpt}</p>
          <p className="text-sm font-medium text-primary-tint">
            {formatDate(post.publishedAt)} · {minutes} min read
          </p>
        </AnimateIn>
      </section>

      {post.coverImage && (
        <div className="container-custom relative z-10 -mt-24 max-w-4xl md:-mt-36">
          <AnimateIn>
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-surface shadow-frame-lift">
              <Image src={post.coverImage} alt={post.title} fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
            </div>
          </AnimateIn>
        </div>
      )}

      <article className="container-custom max-w-3xl py-24">
        <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      <div className="container-custom max-w-3xl pb-24">
        <AuthorBox />
      </div>

      {related.length > 0 && (
        <section className="bg-surface py-24">
          <div className="container-custom max-w-5xl">
            <AnimateIn>
              <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground md:text-3xl">Keep reading</h2>
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary">
                  <ArrowBack sx={{ fontSize: 16 }} /> All posts
                </Link>
              </div>
            </AnimateIn>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <AnimateIn key={p.id} delay={i * 0.05}>
                  <PostCard post={p} />
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
