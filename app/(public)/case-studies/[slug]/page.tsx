import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OpenInNew, GitHub, ArrowBack, CheckCircle } from "@mui/icons-material"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const cs = await prisma.caseStudy.findUnique({ where: { slug, published: true } })
    if (!cs) return {}
    return {
      title: cs.title,
      description: cs.excerpt,
      alternates: { canonical: `/case-studies/${slug}` },
      openGraph: {
        title: `${cs.title} — Case Study by Kondwani Muwowo`,
        description: cs.excerpt,
        url: `/case-studies/${slug}`,
        images: cs.coverImage ? [{ url: cs.coverImage }] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params
  let cs
  try {
    cs = await prisma.caseStudy.findUnique({ where: { slug, published: true } })
  } catch {
    notFound()
  }
  if (!cs) notFound()

  return (
    <main className="min-h-screen bg-background pt-24 pb-20">
      {/* Cover */}
      {cs.coverImage && (
        <div className="relative h-72 md:h-[480px] bg-surface overflow-hidden">
          <Image src={cs.coverImage} alt={cs.title} fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>
      )}

      <div className="container-custom max-w-4xl pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-foreground truncate">{cs.title}</span>
        </nav>

        {/* Title block */}
        <div className="mb-8">
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/8 px-3 py-1 rounded-full mb-4 inline-block">
            Case Study
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">{cs.title}</h1>
          {cs.client && <p className="text-lg text-muted">Client: <span className="font-medium text-foreground">{cs.client}</span></p>}
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 text-sm text-muted bg-white border border-border rounded-2xl px-8 py-5 shadow-sm mb-10">
          {cs.year && <span><span className="font-semibold text-foreground">Year</span> · {cs.year}</span>}
          {cs.duration && <span><span className="font-semibold text-foreground">Duration</span> · {cs.duration}</span>}
          {cs.role && <span><span className="font-semibold text-foreground">Role</span> · {cs.role}</span>}
          {cs.tech.length > 0 && <span><span className="font-semibold text-foreground">Stack</span> · {cs.tech.length} technologies</span>}
          <div className="ml-auto flex gap-3">
            {cs.liveUrl && (
              <a href={cs.liveUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-primary-hover transition-colors">
                Live <OpenInNew sx={{ fontSize: 13 }} />
              </a>
            )}
            {cs.githubUrl && (
              <a href={cs.githubUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border border-border text-foreground px-4 py-1.5 rounded-full text-xs font-medium hover:border-primary hover:text-primary transition-colors">
                <GitHub sx={{ fontSize: 13 }} /> Code
              </a>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <p className="text-xl text-muted leading-relaxed mb-12 max-w-2xl">{cs.excerpt}</p>

        {/* Problem + Solution */}
        {(cs.problem || cs.solution) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {cs.problem && (
              <div className="bg-white border border-border rounded-2xl p-7 shadow-sm">
                <h2 className="text-sm font-bold tracking-widest uppercase text-primary mb-3">The Problem</h2>
                <p className="text-muted text-sm leading-relaxed">{cs.problem}</p>
              </div>
            )}
            {cs.solution && (
              <div className="bg-white border border-border rounded-2xl p-7 shadow-sm">
                <h2 className="text-sm font-bold tracking-widest uppercase text-primary mb-3">The Solution</h2>
                <p className="text-muted text-sm leading-relaxed">{cs.solution}</p>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {cs.content && (
          <div
            className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted prose-a:text-primary prose-strong:text-foreground mb-12"
            dangerouslySetInnerHTML={{ __html: cs.content }}
          />
        )}

        {/* Outcomes */}
        {cs.outcomes.length > 0 && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-foreground mb-5">Outcomes</h2>
            <ul className="space-y-3">
              {cs.outcomes.map((outcome: string, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-primary shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
                  <span className="text-sm text-muted">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Gallery */}
        {cs.gallery.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-5">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cs.gallery.map((img: string, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-surface border border-border">
                  <Image src={img} alt={`${cs.title} screenshot ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonial */}
        {cs.testimonial && (
          <blockquote className="bg-primary/5 border-l-4 border-primary rounded-r-2xl px-8 py-6 mb-10">
            <p className="text-foreground italic leading-relaxed mb-3">&ldquo;{cs.testimonial}&rdquo;</p>
            {cs.testimonialAuthor && (
              <footer className="text-sm font-medium text-muted">
                — {cs.testimonialAuthor}{cs.testimonialRole && `, ${cs.testimonialRole}`}
              </footer>
            )}
          </blockquote>
        )}

        {/* Tech stack */}
        {cs.tech.length > 0 && (
          <div className="mb-10">
            <h3 className="text-sm font-bold tracking-widest uppercase text-muted mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {cs.tech.map((t: string) => (
                <span key={t} className="text-xs font-medium bg-surface border border-border text-foreground/70 px-3 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-border">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
            <ArrowBack sx={{ fontSize: 16 }} /> Back to Projects
          </Link>
        </div>
      </div>
    </main>
  )
}
