import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OpenInNew, GitHub, ArrowBack, ArrowForward } from "@mui/icons-material"
import { db, project } from "@/lib/db"
import { and, asc, eq, isNotNull } from "drizzle-orm"
import { AnimateIn } from "@/components/ui/AnimateIn"
import { ProjectCover } from "@/components/project/ProjectCover"
import { ProjectGallery } from "@/components/project/ProjectGallery"
import { SITE } from "@/data/site"
import { breadcrumbJsonLd, ogImage, PERSON_REF, twitterCard } from "@/lib/seo"

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const projects = await db
    .select({ slug: project.slug })
    .from(project)
    .where(and(eq(project.published, true), isNotNull(project.slug)))
  return projects.map((p) => ({ slug: p.slug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const proj = await db.query.project.findFirst({ where: (t, { eq }) => eq(t.slug, slug) })
  if (!proj) return {}
  const images = ogImage("project", slug, proj.title, proj.updatedAt)
  return {
    title: proj.title,
    description: proj.excerpt ?? proj.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${proj.title}, Kondwani Muwowo`,
      description: proj.excerpt ?? proj.description,
      url: `/projects/${slug}`,
      type: "article",
      images,
    },
    twitter: twitterCard(images),
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const proj = await db.query.project.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
  if (!proj) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: proj.title,
    headline: proj.title,
    description: proj.excerpt ?? proj.description,
    abstract: proj.excerpt ?? undefined,
    url: `${SITE.url}/projects/${slug}`,
    image: [proj.imageUrl, ...(proj.gallery ?? [])].filter(Boolean),
    creator: PERSON_REF,
    author: PERSON_REF,
    dateCreated: proj.year ? String(proj.year) : undefined,
    dateModified: proj.updatedAt.toISOString(),
    genre: proj.category,
    keywords: proj.tech.join(", "),
    sameAs: proj.liveUrl ?? undefined,
    codeRepository: proj.githubUrl ?? undefined,
  }
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: proj.title, path: `/projects/${slug}` },
  ])

  const cover = proj.imageUrl ?? proj.gallery?.[0] ?? null
  const gallery = (proj.gallery ?? []).filter((src) => src !== cover)
  const allImages = cover ? [cover, ...gallery] : gallery
  const host = getHost(proj.liveUrl)
  const alt = `${proj.title}, built by Kondwani Muwowo using ${proj.tech.join(", ")}`

  const siblings = await db
    .select({ slug: project.slug, title: project.title })
    .from(project)
    .where(and(eq(project.published, true), isNotNull(project.slug)))
    .orderBy(asc(project.order))
  const currentIndex = siblings.findIndex((p) => p.slug === slug)
  const next = siblings.length > 1 ? siblings[(currentIndex + 1) % siblings.length] : null

  const details = [
    { label: "Role", value: proj.role },
    { label: "Year", value: proj.year?.toString() },
    { label: "Type", value: proj.category },
    { label: "Status", value: proj.status },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <main className="min-h-screen bg-white">
        {/* Hero band */}
        <section className={`bg-primary pt-40 ${cover ? "pb-32 md:pb-48" : "pb-24"}`}>
          <AnimateIn className="container-custom max-w-3xl text-center">
            <Link
              href="/projects"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-primary-tint transition-colors hover:text-white"
            >
              <ArrowBack sx={{ fontSize: 16 }} /> All projects
            </Link>
            <h1 className="mb-6 text-2xl font-bold tracking-tight text-white md:text-4xl">{proj.title}</h1>
            {proj.excerpt && (
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-primary-tint">{proj.excerpt}</p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              {proj.liveUrl && (
                <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-tint">
                  Visit site <OpenInNew sx={{ fontSize: 16 }} />
                </a>
              )}
              {proj.githubUrl && (
                <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-dark px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
                  <GitHub sx={{ fontSize: 16 }} /> View code
                </a>
              )}
            </div>
          </AnimateIn>
        </section>

        {/* Cover in a browser frame, overlapping the band */}
        {cover && (
          <div className="container-custom relative z-10 -mt-24 max-w-3xl md:-mt-36">
            <ProjectCover images={allImages} alt={alt} host={host} />
          </div>
        )}

        {/* About + details */}
        <section className="container-custom max-w-4xl py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <AnimateIn className="lg:col-span-2">
              <h2 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">About this project</h2>
              <p className="whitespace-pre-line text-lg leading-relaxed text-muted">{proj.description}</p>
            </AnimateIn>

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
                <h3 className="mb-4 text-sm font-bold text-foreground">Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {proj.tech.map((t) => (
                    <span key={t} className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              </aside>
            </AnimateIn>
          </div>
        </section>

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="overflow-hidden bg-surface py-24">
            <AnimateIn className="container-custom mb-16 max-w-4xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">More screens</h2>
            </AnimateIn>
            <ProjectGallery images={gallery} alt={proj.title} host={host} />
          </section>
        )}

        {/* Next project */}
        {next?.slug && (
          <section className="container-custom max-w-4xl py-24">
            <Link
              href={`/projects/${next.slug}`}
              className="group flex items-center justify-between gap-8 rounded-3xl bg-foreground px-8 py-12 transition-colors hover:bg-primary md:px-12"
            >
              <div>
                <p className="mb-2 text-sm text-muted-dark group-hover:text-primary-tint">Next project</p>
                <p className="text-2xl font-bold text-white md:text-4xl">{next.title}</p>
              </div>
              <ArrowForward className="shrink-0 text-white transition-transform group-hover:translate-x-2" sx={{ fontSize: 32 }} />
            </Link>
          </section>
        )}
      </main>
    </>
  )
}

function getHost(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
