import type { Metadata } from "next"
import { BLOG_CATEGORIES } from "@/data/blogCategories"
import { getPosts } from "@/lib/posts"
import { BLOG_SITE, MAIN_SITE, TWITTER } from "@/lib/site"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { BlogHero } from "@/components/blog/BlogHero"
import { FeaturedPost } from "@/components/blog/FeaturedPost"
import { PostCard } from "@/components/blog/PostCard"

export const revalidate = 60

const description = "Writing on code, faith, chess, the gym, hiking and everyday life, by Kondwani Muwowo."
const card = [{ url: `${MAIN_SITE}/images/og/blog.png`, width: 1200, height: 630, alt: "Blog by Kondwani Muwowo" }]

export const metadata: Metadata = {
  title: { absolute: "Blog, Kondwani Muwowo" },
  description,
  alternates: { canonical: BLOG_SITE },
  openGraph: { type: "website", url: BLOG_SITE, title: "Blog, Kondwani Muwowo", description, images: card },
  twitter: { card: "summary_large_image", creator: TWITTER, site: TWITTER, images: card },
}

export default async function BlogHome() {
  const posts = await getPosts()
  const [featured, ...rest] = posts
  const categories = BLOG_CATEGORIES.filter((c) => posts.some((p) => p.category === c.key))

  return (
    <>
      <BlogHero
        title="Blog"
        subtitle="Writing on code, faith, chess, the gym, hiking and everyday life."
        categories={categories}
        active="all"
        overlap={Boolean(featured)}
      />

      {featured ? (
        <div className="container-custom relative z-10 -mt-24 max-w-5xl md:-mt-28">
          <AnimateIn>
            <FeaturedPost post={featured} />
          </AnimateIn>
        </div>
      ) : (
        <section className="container-custom max-w-3xl py-24 text-center">
          <div className="rounded-3xl bg-white px-8 py-16 shadow-md">
            <h2 className="mb-2 text-xl font-bold text-foreground">The first post is on its way</h2>
            <p className="text-muted">Check back soon.</p>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="container-custom max-w-5xl py-24">
          <AnimateIn>
            <h2 className="mb-12 text-2xl font-bold text-foreground md:text-3xl">More posts</h2>
          </AnimateIn>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <AnimateIn key={post.id} delay={Math.min(i, 5) * 0.05}>
                <PostCard post={post} />
              </AnimateIn>
            ))}
          </div>
        </section>
      )}

      {featured && rest.length === 0 && <div className="pb-24" />}
    </>
  )
}
