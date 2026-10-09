import type { MetadataRoute } from "next"
import { BLOG_CATEGORIES } from "@/data/blogCategories"
import { getPosts } from "@/lib/posts"
import { BLOG_SITE } from "@/lib/site"

// Tech posts are listed in the portfolio's sitemap, where their canonical copy lives
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts()
  const ownPosts = posts.filter((p) => p.category !== "tech")
  const categories = BLOG_CATEGORIES.filter((c) => posts.some((p) => p.category === c.key))

  return [
    { url: BLOG_SITE, lastModified: posts[0]?.publishedAt ?? new Date(), changeFrequency: "weekly", priority: 1 },
    ...categories.map((c) => ({
      url: `${BLOG_SITE}/category/${c.key}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...ownPosts.map((p) => ({
      url: `${BLOG_SITE}/${p.slug}`,
      lastModified: p.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ]
}
