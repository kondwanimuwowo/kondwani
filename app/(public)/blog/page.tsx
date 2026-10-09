import type { Metadata } from "next"
import { ArrowForward } from "@mui/icons-material"
import { ogImage, twitterCard } from "@/lib/seo"
import { getPosts } from "@/lib/blogPosts"
import { BLOG_SITE } from "@/lib/blogSite"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { FeaturedPost } from "@/components/blog/FeaturedPost"
import { PostCard } from "@/components/blog/PostCard"

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on coding, websites and building systems for businesses in Zambia, by Kondwani Muwowo.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog, Kondwani Muwowo",
    description: "Notes on coding, websites and building systems.",
    url: "/blog",
    images: ogImage("page", "blog", "Blog by Kondwani Muwowo"),
  },
  twitter: twitterCard(ogImage("page", "blog", "Blog by Kondwani Muwowo")),
}

export const revalidate = 300

// Only Tech posts live here; faith and life posts live on the personal blog
export default async function BlogPage() {
  const posts = await getPosts("tech")
  const [featured, ...rest] = posts

  return (
    <main className="min-h-screen bg-white">
      <section className={`bg-primary pt-40 ${featured ? "pb-32 md:pb-40" : "pb-24"}`}>
        <AnimateIn className="container-custom max-w-3xl text-center">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-5xl">Blog</h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-primary-tint">
            Notes on coding, websites and building systems.
          </p>
          <a
            href={BLOG_SITE}
            className="inline-flex items-center gap-2 rounded-full bg-primary-dark px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:bg-primary-hover"
          >
            Faith, chess, the gym and more on my personal blog <ArrowForward sx={{ fontSize: 16 }} />
          </a>
        </AnimateIn>
      </section>

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
    </main>
  )
}
