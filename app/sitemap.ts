import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

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
    const projects = await prisma.project.findMany({
      where: { published: true, slug: { not: null } },
      select: { slug: true, updatedAt: true },
    })
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
    const caseStudies = await prisma.caseStudy.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    caseStudyRoutes = caseStudies.map((cs) => ({
      url: `${BASE_URL}/case-studies/${cs.slug}`,
      lastModified: cs.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  } catch {}

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {}

  return [...staticRoutes, ...projectRoutes, ...caseStudyRoutes, ...blogRoutes]
}
