import { prisma } from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true } })
  if (!post) return {}
  return { title: post.title, description: post.excerpt }
}

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { slug: true } })
  return posts.map((p: { slug: string }) => ({ slug: p.slug }))
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug, published: true } })
  if (!post) notFound()

  return (
    <article className="container-custom py-16 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-10">
        ← All posts
      </Link>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.map((tag) => (
          <span key={tag} className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
        {post.title}
      </h1>
      <p className="text-muted mb-3">{post.excerpt}</p>
      {post.publishedAt && (
        <time className="text-sm text-muted/70">{formatDate(post.publishedAt)}</time>
      )}

      {/* Cover image */}
      {post.coverImage && (
        <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden bg-surface my-10">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-neutral max-w-none mt-10 text-foreground/90 leading-relaxed
          prose-headings:font-bold prose-headings:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-primary prose-blockquote:text-muted
          prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-foreground prose-pre:text-white
          prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
