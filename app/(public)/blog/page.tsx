import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { db, blogPost } from "@/lib/db"
import { desc, eq } from "drizzle-orm"

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts on front-end development, UI design, and building purposeful digital products, by Kondwani Muwowo.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Kondwani Muwowo",
    description: "Thoughts on front-end development, UI design, and building purposeful digital products.",
    url: "/blog",
  },
}

export const revalidate = 300

type PostSummary = {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: string | null
  tags: string[]
  publishedAt: Date | null
}

async function getPosts(): Promise<PostSummary[]> {
  try {
    return await db
      .select({
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        excerpt: blogPost.excerpt,
        coverImage: blogPost.coverImage,
        tags: blogPost.tags,
        publishedAt: blogPost.publishedAt,
      })
      .from(blogPost)
      .where(eq(blogPost.published, true))
      .orderBy(desc(blogPost.publishedAt))
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container-custom max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">Blog</h1>
          <div className="h-1 w-20 bg-primary rounded-full mx-auto mb-6" />
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Thoughts on front-end development, design, and building purposeful products.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-24 bg-surface rounded-2xl">
            <h2 className="text-xl font-bold text-foreground mb-2">Coming soon</h2>
            <p className="text-muted text-sm">First post is on its way, check back soon.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group flex gap-6 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                {post.coverImage && (
                  <div className="relative w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-surface">
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="144px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary-tint px-2.5 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted line-clamp-2 mb-2">{post.excerpt}</p>
                  {post.publishedAt && (
                    <p className="text-xs text-muted">
                      {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
