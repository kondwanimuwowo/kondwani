import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OpenInNew, GitHub, ArrowBack, ArrowForward, CheckCircle } from "@mui/icons-material"
import { db, caseStudy } from "@/lib/db"
import { asc, eq } from "drizzle-orm"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { ProjectCover } from "@/components/project/ProjectCover"
import { ProjectGallery } from "@/components/project/ProjectGallery"
import { SITE } from "@/data/site"
import { breadcrumbJsonLd, ogImage, PERSON_REF, twitterCard } from "@/lib/seo"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const cs = await db.query.caseStudy.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
    if (!cs) return {}
    const images = ogImage("case-study", slug, cs.title, cs.updatedAt)
    return {
      title: cs.title,
      description: cs.excerpt,
      alternates: { canonical: `/case-studies/${slug}` },
      openGraph: {
        title: `${cs.title}, case study by Kondwani Muwowo`,
        description: cs.excerpt,
        url: `/case-studies/${slug}`,
        type: "article",
        images,
      },
      twitter: twitterCard(images),
    }
  } catch {
    return {}
  }
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params
  let cs
  try {
    cs = await db.query.caseStudy.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
  } catch {
    notFound()
  }
  if (!cs) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: cs.title,
    description: cs.excerpt,
    url: `${SITE.url}/case-studies/${slug}`,
    image: [cs.coverImage, ...cs.gallery].filter(Boolean),
    author: PERSON_REF,
    publisher: PERSON_REF,
    datePublished: cs.createdAt.toISOString(),
    dateModified: cs.updatedAt.toISOString(),
    keywords: cs.tech.join(", "),
    about: cs.client ? { "@type": "Organization", name: cs.client } : undefined,
    mainEntityOfPage: `${SITE.url}/case-studies/${slug}`,
  }
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: cs.title, path: `/case-studies/${slug}` },
  ])

  const allImages = [cs.coverImage, ...cs.gallery].filter((src): src is string => Boolean(src))
  const gallery = cs.coverImage ? cs.gallery : cs.gallery.slice(1)
  const host = getHost(cs.liveUrl)
  const alt = `${cs.title} case study by Kondwani Muwowo`

  const siblings = await db
    .select({ slug: caseStudy.slug, title: caseStudy.title })
    .from(caseStudy)
    .where(eq(caseStudy.published, true))
    .orderBy(asc(caseStudy.order))
  const currentIndex = siblings.findIndex((c) => c.slug === slug)
  const next = siblings.length > 1 ? siblings[(currentIndex + 1) % siblings.length] : null

  const details = [
    { label: "Client", value: cs.client },
    { label: "Role", value: cs.role },
    { label: "Year", value: cs.year?.toString() },
    { label: "Duration", value: cs.duration },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <main className="min-h-screen bg-white">
        {/* Hero band */}
        <section className={`bg-primary pt-40 ${allImages.length > 0 ? "pb-32 md:pb-48" : "pb-24"}`}>
          <AnimateIn className="container-custom max-w-3xl text-center">
            <Link
              href="/projects"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary-tint transition-colors hover:text-white"
            >
              <ArrowBack sx={{ fontSize: 16 }} /> All projects
            </Link>
            <h1 className="mb-6 text-2xl font-bold tracking-tight text-white md:text-4xl">{cs.title}</h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-primary-tint">{cs.excerpt}</p>
            <p className="mb-8 text-sm font-medium text-primary-tint">
              {["Case study", cs.year, cs.duration].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {cs.liveUrl && (
                <a href={cs.liveUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-tint">
                  Visit site <OpenInNew sx={{ fontSize: 16 }} />
                </a>
              )}
              {cs.githubUrl && (
                <a href={cs.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-dark px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
                  <GitHub sx={{ fontSize: 16 }} /> View code
                </a>
              )}
            </div>
          </AnimateIn>
        </section>

        {/* Cover in a browser frame, overlapping the band */}
        {allImages.length > 0 && (
          <div className="container-custom relative z-10 -mt-24 max-w-3xl md:-mt-36">
            <ProjectCover images={allImages} alt={alt} host={host} />
          </div>
        )}

        {/* Problem, solution and details */}
        <section className="container-custom max-w-4xl py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="space-y-12 lg:col-span-2">
              {cs.problem && (
                <AnimateIn>
                  <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">The problem</h2>
                  <p className="text-lg leading-relaxed text-muted">{cs.problem}</p>
                </AnimateIn>
              )}
              {cs.solution && (
                <AnimateIn delay={0.1}>
                  <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">The solution</h2>
                  <p className="text-lg leading-relaxed text-muted">{cs.solution}</p>
                </AnimateIn>
              )}
            </div>

            <AnimateIn delay={0.1}>
              <aside className="rounded-3xl bg-white p-8 shadow-md">
                {details.length > 0 && (
                  <dl className="mb-8 space-y-4">
                    {details.map((d) => (
                      <div key={d.label} className="flex items-baseline justify-between gap-4">
                        <dt className="text-sm text-muted">{d.label}</dt>
                        <dd className="text-right text-sm font-medium text-foreground">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {cs.tech.length > 0 && (
                  <>
                    <h3 className="mb-4 text-sm font-bold text-foreground">Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {cs.tech.map((t) => (
                        <span key={t} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">{t}</span>
                      ))}
                    </div>
                  </>
                )}
              </aside>
            </AnimateIn>
          </div>
        </section>

        {/* Article */}
        {cs.content && (
          <section className="container-custom max-w-4xl pb-24">
            <AnimateIn>
              <div className="article-body max-w-3xl" dangerouslySetInnerHTML={{ __html: cs.content }} />
            </AnimateIn>
          </section>
        )}

        {/* Outcomes */}
        {cs.outcomes.length > 0 && (
          <section className="bg-surface py-24">
            <div className="container-custom max-w-4xl">
              <AnimateIn>
                <h2 className="mb-12 text-2xl font-bold text-foreground md:text-3xl">Outcomes</h2>
              </AnimateIn>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {cs.outcomes.map((outcome, i) => (
                  <AnimateIn key={i} delay={Math.min(i, 5) * 0.05}>
                    <div className="flex h-full items-start gap-4 rounded-3xl bg-white p-6 shadow-md">
                      <CheckCircle className="mt-0.5 shrink-0 text-primary" sx={{ fontSize: 24 }} />
                      <p className="leading-relaxed text-foreground">{outcome}</p>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="overflow-hidden py-24">
            <AnimateIn className="container-custom mb-16 max-w-4xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">More screens</h2>
            </AnimateIn>
            <ProjectGallery images={gallery} alt={cs.title} host={host} />
          </section>
        )}

        {/* Client quote */}
        {cs.testimonial && (
          <section className="bg-primary-tint py-24">
            <AnimateIn className="container-custom max-w-3xl text-center">
              <blockquote>
                <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl">&quot;{cs.testimonial}&quot;</p>
                {cs.testimonialAuthor && (
                  <footer className="mt-8 text-sm text-muted">
                    <span className="font-bold text-primary">{cs.testimonialAuthor}</span>
                    {cs.testimonialRole && `, ${cs.testimonialRole}`}
                  </footer>
                )}
              </blockquote>
            </AnimateIn>
          </section>
        )}

        {/* Next case study */}
        <section className="container-custom max-w-4xl py-24">
          {next?.slug ? (
            <Link
              href={`/case-studies/${next.slug}`}
              className="group flex items-center justify-between gap-8 rounded-3xl bg-foreground px-8 py-12 transition-colors hover:bg-primary md:px-12"
            >
              <div>
                <p className="mb-2 text-sm text-muted-dark group-hover:text-primary-tint">Next case study</p>
                <p className="text-2xl font-bold text-white md:text-4xl">{next.title}</p>
              </div>
              <ArrowForward className="shrink-0 text-white transition-transform group-hover:translate-x-2" sx={{ fontSize: 32 }} />
            </Link>
          ) : (
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary">
              <ArrowBack sx={{ fontSize: 16 }} /> Back to projects
            </Link>
          )}
        </section>
      </main>
    </>
  )
}

function getHost(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www[.]/, "")
  } catch {
    return null
  }
}
