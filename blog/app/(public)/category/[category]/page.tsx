import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BLOG_CATEGORIES, findCategory } from "@/data/blogCategories"
import { getPosts } from "@/lib/posts"
import { BLOG_SITE, MAIN_SITE, TWITTER } from "@/lib/site"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { BlogHero } from "@/components/blog/BlogHero"
import { PostCard } from "@/components/blog/PostCard"

export const revalidate = 60

type Props = { params: Promise<{ category: string }> }

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ category: c.key }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = findCategory((await params).category)
  if (!category) return {}
  const url = `${BLOG_SITE}/category/${category.key}`
  const title = `${category.label}, Kondwani Muwowo`
  const card = [{ url: `${MAIN_SITE}/images/og/blog.png`, width: 1200, height: 630, alt: title }]
  return {
    title: { absolute: title },
    description: category.description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description: category.description, images: card },
    twitter: { card: "summary_large_image", creator: TWITTER, site: TWITTER, images: card },
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = findCategory((await params).category)
  if (!category) notFound()

  const [posts, allPosts] = await Promise.all([getPosts(category.key), getPosts()])
  const categories = BLOG_CATEGORIES.filter((c) => allPosts.some((p) => p.category === c.key))

  return (
    <>
      <BlogHero title={category.label} subtitle={category.description} categories={categories} active={category.key} />

      <section className="container-custom max-w-5xl py-24">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-3xl rounded-3xl bg-white px-8 py-16 text-center shadow-md">
            <h2 className="mb-2 text-xl font-bold text-foreground">Nothing here yet</h2>
            <p className="text-muted">Posts in {category.label} will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <AnimateIn key={post.id} delay={Math.min(i, 5) * 0.05}>
                <PostCard post={post} />
              </AnimateIn>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
