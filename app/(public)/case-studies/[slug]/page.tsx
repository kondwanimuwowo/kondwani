import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OpenInNew, GitHub, ArrowBack, CheckCircle } from "@mui/icons-material"
import { db } from "@/lib/db"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const cs = await db.query.caseStudy.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
    if (!cs) return {}
    return {
      title: cs.title,
      description: cs.excerpt,
      alternates: { canonical: `/case-studies/${slug}` },
      openGraph: {
        title: `${cs.title}, Case Study by Kondwani Muwowo`,
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
    cs = await db.query.caseStudy.findFirst({ where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.published, true)) })
  } catch {
    notFound()
  }
  if (!cs) notFound()

  return (
    <main className="min-h-screen bg-surface pt-24 pb-20">
      {/* Cover */}
      {cs.coverImage && (
        <div className="relative h-72 md:h-[480px] bg-surface overflow-hidden">
          <Image src={cs.coverImage} alt={cs.title} fill className="object-cover" priority sizes="100vw" />
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
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">{cs.title}</h1>
          {cs.client && <p className="text-lg text-muted">Client: <span className="font-medium text-foreground">{cs.client}</span></p>}
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 text-sm text-muted bg-white rounded-3xl px-8 py-5 shadow-md mb-10">
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
                className="inline-flex items-center gap-1.5 bg-surface text-foreground px-4 py-1.5 rounded-full text-xs font-medium shadow-md hover:text-primary transition-colors">
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
              <div className="bg-white rounded-3xl p-7 shadow-md">
                <h2 className="text-sm font-bold tracking-widest uppercase text-primary mb-3">The Problem</h2>
                <p className="text-muted text-sm leading-relaxed">{cs.problem}</p>
              </div>
            )}
            {cs.solution && (
              <div className="bg-white rounded-3xl p-7 shadow-md">
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
          <div className="bg-white rounded-3xl p-8 shadow-md mb-8">
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
                <div key={i} className="relative aspect-video rounded-3xl overflow-hidden bg-surface">
                  <Image src={img} alt={`${cs.title} screenshot ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonial */}
        {cs.testimonial && (
          <blockquote className="bg-primary-tint rounded-3xl px-8 py-6 mb-10">
            <p className="text-foreground italic leading-relaxed mb-3">&quot;{cs.testimonial}&quot;</p>
            {cs.testimonialAuthor && (
              <footer className="text-sm font-medium text-muted">
                {cs.testimonialAuthor}{cs.testimonialRole && `, ${cs.testimonialRole}`}
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
                <span key={t} className="text-xs font-medium bg-surface text-muted px-3 py-1.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-8">
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors">
            <ArrowBack sx={{ fontSize: 16 }} /> Back to Projects
          </Link>
        </div>
      </div>
    </main>
  )
}
