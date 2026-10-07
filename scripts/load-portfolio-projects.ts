// Loads data/portfolioProjects.ts into the Project table.
// Dry run by default; pass --apply to write.
// A project matching an existing row (by slug or alias, then by live URL host) only has its copy updated:
// its slug, images and published flag are left alone. New projects are inserted unpublished.
import { drizzle } from "drizzle-orm/node-postgres"
import { eq } from "drizzle-orm"
import { Pool } from "pg"
import * as dotenv from "dotenv"
import { project } from "../lib/db/schema"
import { portfolioProjects, type PortfolioProject } from "../data/portfolioProjects"

dotenv.config({ path: ".env" })

const apply = process.argv.includes("--apply")
const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const db = drizzle(pool)

function host(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function copyFields(p: PortfolioProject) {
  return {
    title: p.title,
    excerpt: p.excerpt,
    description: p.description.join("\n\n"),
    tech: p.tech,
    category: p.category,
    role: p.role,
    year: p.year,
    status: p.status,
    liveUrl: p.liveUrl,
    githubUrl: p.githubUrl,
    featured: p.featured,
    order: p.order,
  }
}

async function main() {
  const existing = await db
    .select({ id: project.id, slug: project.slug, title: project.title, liveUrl: project.liveUrl, published: project.published })
    .from(project)

  const matchedIds = new Set<string>()
  const plan = portfolioProjects.map((p) => {
    const match =
      existing.find((e) => e.slug === p.slug || (e.slug !== null && p.aliases?.includes(e.slug))) ??
      existing.find((e) => p.liveUrl && host(e.liveUrl) === host(p.liveUrl))
    if (match) matchedIds.add(match.id)
    return { p, match }
  })

  console.log(apply ? "Applying:\n" : "Dry run, nothing written. Re-run with --apply to write.\n")
  for (const { p, match } of plan) {
    if (match) {
      const how = match.slug === p.slug ? "slug" : `alias or live URL, keeps slug "${match.slug}"`
      console.log(`  update  ${p.title}  (matched "${match.title}" by ${how}, ${match.published ? "published" : "draft"})`)
    } else {
      console.log(`  insert  ${p.title}  (/projects/${p.slug}, as draft)`)
    }
  }

  const others = existing.filter((e) => e.published && !matchedIds.has(e.id))
  if (others.length > 0) {
    console.log(`\nStill published and not in this list (left untouched):`)
    for (const e of others) console.log(`  ${e.title}  (/projects/${e.slug})`)
  }

  if (!apply) return

  await db.transaction(async (tx) => {
    for (const { p, match } of plan) {
      if (match) {
        await tx.update(project).set(copyFields(p)).where(eq(project.id, match.id))
      } else {
        await tx.insert(project).values({ ...copyFields(p), slug: p.slug, published: false })
      }
    }
  })
  console.log(`\nDone. ${plan.length} projects written.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => pool.end())
