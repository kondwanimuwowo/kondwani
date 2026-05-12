import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OpenInNew, GitHub, ArrowBack } from "@mui/icons-material"
import { projects } from "@/data/projects"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) return {}
  return {
    title: project.title,
    description: project.excerpt ?? project.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${project.title} — Kondwani Muwowo`,
      description: project.excerpt ?? project.description,
      url: `/projects/${slug}`,
      images: project.image ? [{ url: project.image }] : [],
    },
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.excerpt ?? project.description,
    applicationCategory: "WebApplication",
    author: {
      "@type": "Person",
      name: "Kondwani Muwowo",
      url: "https://kondwanimuwowo.com",
    },
    url: project.liveUrl,
    operatingSystem: "Web",
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-background pt-24 pb-20">
        {/* Cover image */}
        <div className="relative h-64 md:h-96 bg-surface overflow-hidden">
          <Image
            src={project.image}
            alt={`${project.title} — built by Kondwani Muwowo using ${project.tech.join(", ")}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="container-custom max-w-4xl -mt-16 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-foreground">{project.title}</span>
          </nav>

          {/* Header card */}
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/8 px-3 py-1 rounded-full">
                    {project.category}
                  </span>
                  {project.status && (
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted bg-surface border border-border px-3 py-1 rounded-full">
                      {project.status}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{project.title}</h1>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 shrink-0">
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-colors">
                  Live Demo <OpenInNew sx={{ fontSize: 16 }} />
                </a>
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                    <GitHub sx={{ fontSize: 16 }} /> Code
                  </a>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-6 text-sm text-muted border-t border-border pt-5">
              {project.year && <span><span className="font-medium text-foreground">Year</span> · {project.year}</span>}
              {project.role && <span><span className="font-medium text-foreground">Role</span> · {project.role}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4">About This Project</h2>
                <p className="text-muted leading-relaxed">{project.description}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground mb-4 tracking-wide uppercase">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span key={t} className="text-xs font-medium bg-surface border border-border text-foreground/70 px-3 py-1.5 rounded-full">
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
