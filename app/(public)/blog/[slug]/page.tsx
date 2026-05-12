import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug, published: true } })
    if (!post) return {}
    return {
      title: post.title,
      description: post.excerpt,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title: `${post.title} — Kondwani Muwowo`,
        description: post.excerpt,
        url: `/blog/${slug}`,
        type: "article",
        publishedTime: post.publishedAt?.toISOString(),
        images: post.coverImage ? [{ url: post.coverImage }] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  let post
  try {
    post = await prisma.blogPost.findUnique({ where: { slug, published: true } })
  } catch {
    notFound()
  }
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: "Kondwani Muwowo", url: "https://kondwanimuwowo.com" },
    datePublished: post.publishedAt?.toISOString(),
    image: post.coverImage,
    url: `https://kondwanimuwowo.com/blog/${slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-background pt-24 pb-20">
        {post.coverImage && (
          <div className="relative h-64 md:h-96 bg-surface overflow-hidden mb-0">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
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
              <span key={tag} className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
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

          <div className="mt-16 pt-8 border-t border-border">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
              <ArrowBack sx={{ fontSize: 16 }} /> Back to Blog
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
