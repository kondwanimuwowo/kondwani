// Loads data/caseStudies.ts into the CaseStudy table.
// Dry run by default; pass --apply to write.
// New case studies are inserted published, at the end of the list. An existing one (matched by slug) only has
// its copy updated: its cover, gallery, testimonial, order and published flag are left alone.
import { drizzle } from "drizzle-orm/node-postgres"
import { eq, max } from "drizzle-orm"
import { Pool } from "pg"
import * as dotenv from "dotenv"
import { caseStudy } from "../lib/db/schema"
import { caseStudies, type CaseStudyContent } from "../data/caseStudies"

dotenv.config({ path: ".env" })

const apply = process.argv.includes("--apply")
const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const db = drizzle(pool)

function copyFields(c: CaseStudyContent) {
  return {
    title: c.title,
    client: c.client,
    role: c.role,
    year: c.year,
    duration: c.duration,
    excerpt: c.excerpt,
    problem: c.problem,
    solution: c.solution,
    content: c.content,
    outcomes: c.outcomes,
    tech: c.tech,
    liveUrl: c.liveUrl,
    githubUrl: c.githubUrl,
  }
}

async function main() {
  const existing = await db
    .select({ id: caseStudy.id, slug: caseStudy.slug, title: caseStudy.title, published: caseStudy.published })
    .from(caseStudy)

  const plan = caseStudies.map((c) => ({ c, match: existing.find((e) => e.slug === c.slug) }))

  console.log(apply ? "Applying:\n" : "Dry run, nothing written. Re-run with --apply to write.\n")
  for (const { c, match } of plan) {
    console.log(match
      ? `  update  ${c.title}  (/case-studies/${c.slug}, stays ${match.published ? "published" : "a draft"})`
      : `  insert  ${c.title}  (/case-studies/${c.slug}, published)`)
  }
  if (!apply) return

  await db.transaction(async (tx) => {
    const [{ last }] = await tx.select({ last: max(caseStudy.order) }).from(caseStudy)
    let nextOrder = (last ?? 0) + 1
    for (const { c, match } of plan) {
      if (match) {
        await tx.update(caseStudy).set(copyFields(c)).where(eq(caseStudy.id, match.id))
      } else {
        await tx.insert(caseStudy).values({
          ...copyFields(c),
          slug: c.slug,
          gallery: [],
          order: nextOrder++,
          published: true,
          publishedAt: new Date(),
        })
      }
    }
  })
  console.log(`\nDone. ${plan.length} case studies written.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => pool.end())
