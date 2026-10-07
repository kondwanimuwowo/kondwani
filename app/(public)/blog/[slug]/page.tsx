import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import { db } from "@/lib/db"
import { SITE } from "@/data/site"
import { breadcrumbJsonLd, ogImage, PERSON_REF, twitterCard } from "@/lib/seo"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await db.query.blogPost.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
    if (!post) return {}
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
  } catch {
    return {}
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  let post
  try {
    post = await db.query.blogPost.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
  } catch {
    notFound()
  }
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: PERSON_REF,
    publisher: PERSON_REF,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
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
      <main className="min-h-screen bg-background pt-24 pb-20">
        {post.coverImage && (
          <div className="relative h-64 md:h-96 bg-surface overflow-hidden mb-0">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="100vw" />
          </div>
        )}

        <div className="container-custom max-w-3xl pt-10">
          <nav className="flex items-center gap-2 text-sm text-muted mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate">{post.title}</span>
          </nav>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary-tint px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{post.title}</h1>

          {post.publishedAt && (
            <p className="text-sm text-muted mb-10">
              {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}

          <div
            className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted prose-a:text-primary prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-16 pt-8">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
              <ArrowBack sx={{ fontSize: 16 }} /> Back to Blog
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
