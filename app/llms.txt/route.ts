import { db } from "@/lib/db"
import { SITE, SERVICES } from "@/data/site"

// llms.txt (llmstxt.org): a plain summary of the site for AI answer engines, built from live content
export async function GET() {
  const [projects, caseStudies, posts] = await Promise.all([
    db.query.project
      .findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { asc }) => asc(t.order) })
      .catch(() => []),
    db.query.caseStudy
      .findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { asc }) => asc(t.order) })
      .catch(() => []),
    db.query.blogPost
      .findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { desc }) => desc(t.publishedAt) })
      .catch(() => []),
  ])

  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    `${SITE.name} is a ${SITE.jobTitle.toLowerCase()} based in ${SITE.locality}, ${SITE.country}. Payments on his sites run through Lenco, so customers can pay by mobile money or card. New projects start with a free 15-minute consultation.`,
    "",
    "## Services",
    "",
    ...SERVICES.map((s) => `- ${s.name}: ${s.description}`),
    "",
    "## Projects",
    "",
    ...projects
      .filter((p) => p.slug)
      .map((p) => `- [${p.title}](${SITE.url}/projects/${p.slug}): ${p.excerpt ?? p.description}${p.category ? ` (${p.category}${p.year ? `, ${p.year}` : ""})` : ""}`),
  ]

  if (caseStudies.length > 0) {
    lines.push("", "## Case studies", "", ...caseStudies.map((cs) => `- [${cs.title}](${SITE.url}/case-studies/${cs.slug}): ${cs.excerpt}`))
  }
  if (posts.length > 0) {
    lines.push("", "## Blog", "", ...posts.map((p) => `- [${p.title}](${SITE.url}/blog/${p.slug}): ${p.excerpt}`))
  }

  lines.push(
    "",
    "## Contact",
    "",
    `- [Contact page](${SITE.url}/contact): project enquiries`,
    ...SITE.sameAs.map((url) => `- ${url}`),
    "",
  )

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
