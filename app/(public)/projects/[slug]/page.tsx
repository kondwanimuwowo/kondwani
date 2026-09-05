import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OpenInNew, GitHub, ArrowBack } from "@mui/icons-material"
import { db, project } from "@/lib/db"
import { and, eq, isNotNull } from "drizzle-orm"

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
  return {
    title: proj.title,
    description: proj.excerpt ?? proj.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${proj.title}, Kondwani Muwowo`,
      description: proj.excerpt ?? proj.description,
      url: `/projects/${slug}`,
      images: proj.imageUrl ? [{ url: proj.imageUrl }] : [],
    },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const proj = await db.query.project.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
  if (!proj) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: proj.title,
    description: proj.excerpt ?? proj.description,
    applicationCategory: "WebApplication",
    author: {
      "@type": "Person",
      name: "Kondwani Muwowo",
      url: "https://kondwanimuwowo.com",
    },
    url: proj.liveUrl,
    operatingSystem: "Web",
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-surface pt-24 pb-20">
        {/* Cover image */}
        <div className="relative h-64 md:h-96 bg-surface overflow-hidden">
          {proj.imageUrl ? (
            <Image
              src={proj.imageUrl}
              alt={`${proj.title}, built by Kondwani Muwowo using ${proj.tech.join(", ")}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}
        </div>

        <div className="container-custom max-w-4xl -mt-16 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-foreground">{proj.title}</span>
          </nav>

          {/* Header card */}
          <div className="bg-white rounded-3xl p-8 shadow-md mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary-tint px-3 py-1 rounded-full">
                    {proj.category}
                  </span>
                  {proj.status && (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted bg-surface px-3 py-1 rounded-full">
                      {proj.status}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{proj.title}</h1>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 shrink-0">
                {proj.liveUrl && (
                  <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors">
                    Live Demo <OpenInNew sx={{ fontSize: 16 }} />
                  </a>
                )}
                {proj.githubUrl && (
                  <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-surface text-foreground px-5 py-2.5 rounded-full text-sm font-medium shadow-md hover:text-primary transition-colors">
                    <GitHub sx={{ fontSize: 16 }} /> Code
                  </a>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-6 text-sm text-muted pt-5">
              {proj.year && <span><span className="font-medium text-foreground">Year</span> · {proj.year}</span>}
              {proj.role && <span><span className="font-medium text-foreground">Role</span> · {proj.role}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-4">About This Project</h2>
                <p className="text-muted leading-relaxed">{proj.description}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-6 shadow-md">
                <h3 className="text-sm font-bold text-foreground mb-4 tracking-wide uppercase">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {proj.tech.map((t) => (
                    <span key={t} className="text-xs font-medium bg-surface text-muted px-3 py-1.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12">
            <Link href="/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
              <ArrowBack sx={{ fontSize: 16 }} /> Back to Projects
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
