import type { MetadataRoute } from "next"
import { db, project, caseStudy, blogPost } from "@/lib/db"
import { and, eq, isNotNull } from "drizzle-orm"

const BASE_URL = "https://kondwanimuwowo.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/beyond-code`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ]

  let projectRoutes: MetadataRoute.Sitemap = []
  let caseStudyRoutes: MetadataRoute.Sitemap = []
  let blogRoutes: MetadataRoute.Sitemap = []

  try {
    const projects = await db
      .select({ slug: project.slug, updatedAt: project.updatedAt })
      .from(project)
      .where(and(eq(project.published, true), isNotNull(project.slug)))
    projectRoutes = projects
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/projects/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))
  } catch {}

  try {
    const caseStudies = await db
      .select({ slug: caseStudy.slug, updatedAt: caseStudy.updatedAt })
      .from(caseStudy)
      .where(eq(caseStudy.published, true))
    caseStudyRoutes = caseStudies.map((cs) => ({
      url: `${BASE_URL}/case-studies/${cs.slug}`,
      lastModified: cs.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  } catch {}

  try {
    const posts = await db
      .select({ slug: blogPost.slug, updatedAt: blogPost.updatedAt })
      .from(blogPost)
      .where(eq(blogPost.published, true))
    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {}

  return [...staticRoutes, ...projectRoutes, ...caseStudyRoutes, ...blogRoutes]
}
