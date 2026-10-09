import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { ArrowBack, ArrowForward } from "@mui/icons-material"
import { db } from "@/lib/db"
import { SITE } from "@/data/site"
import { categoryLabel } from "@/data/blogCategories"
import { breadcrumbJsonLd, ogImage, PERSON_REF, twitterCard } from "@/lib/seo"
import { formatDate, getRelated, readingMinutes } from "@/lib/blogPosts"
import { BLOG_SITE } from "@/lib/blogSite"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { PostCard } from "@/components/blog/PostCard"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

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
  if (!post || post.category !== "tech") return {}
  const images = ogImage("blog", slug, post.title, post.updatedAt)
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: `${post.title}, Kondwani Muwowo`,
      description: post.excerpt,
      url: `/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [SITE.url],
      images,
    },
    twitter: twitterCard(images),
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  // Faith and life posts live on the personal blog
  if (post.category !== "tech") permanentRedirect(`${BLOG_SITE}/${slug}`)

  const related = (await getRelated(slug, "tech")).filter((p) => p.category === "tech")
  const minutes = readingMinutes(post.content)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    author: PERSON_REF,
    publisher: PERSON_REF,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    articleSection: categoryLabel(post.category),
    image: post.coverImage ?? `${SITE.url}/og/blog/${slug}`,
    url: `${SITE.url}/blog/${slug}`,
    mainEntityOfPage: `${SITE.url}/blog/${slug}`,
  }
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <main className="min-h-screen bg-white">
        <section className={`bg-primary pt-40 ${post.coverImage ? "pb-32 md:pb-48" : "pb-24"}`}>
          <AnimateIn className="container-custom max-w-3xl text-center">
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary-tint transition-colors hover:text-white"
            >
              <ArrowBack sx={{ fontSize: 16 }} /> All posts
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
          <aside className="flex flex-col items-start gap-6 rounded-3xl bg-white p-8 shadow-md sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface">
              <Image src="/kondwani.png" alt="Kondwani Muwowo" fill sizes="80px" className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-lg font-bold text-foreground">Kondwani Muwowo</p>
              <p className="leading-relaxed text-muted">
                Software developer in Lusaka, Zambia. I also write about faith, chess, the gym and hiking.
              </p>
            </div>
            <a
              href={BLOG_SITE}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary"
            >
              Personal blog <ArrowForward sx={{ fontSize: 16 }} />
            </a>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="bg-surface py-24">
            <div className="container-custom max-w-5xl">
              <AnimateIn>
                <h2 className="mb-12 text-2xl font-bold text-foreground md:text-3xl">Keep reading</h2>
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
      </main>
    </>
  )
}
