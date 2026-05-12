import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Blog" }

export const revalidate = 60

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)
}

export default async function BlogListing() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, tags: true, publishedAt: true },
  })

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mb-14">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">Writing</p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">Blog</h1>
        <p className="text-muted">Thoughts on front-end development, design, and building things that matter.</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet. Check back soon.</p>
      ) : (
        <div className="space-y-10">
          {posts.map((post) => (
            <article key={post.id} className="group grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 pb-10 border-b border-border last:border-0">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/8 px-2.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/${post.slug}`}>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 leading-snug">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-muted leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <time className="text-sm text-muted">
                    {post.publishedAt ? formatDate(post.publishedAt) : ""}
                  </time>
                  <Link href={`/${post.slug}`}
                    className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                    Read more →
                  </Link>
                </div>
              </div>
              {post.coverImage && (
                <div className="relative h-48 md:h-auto rounded-xl overflow-hidden bg-surface order-first md:order-last">
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="280px" />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
