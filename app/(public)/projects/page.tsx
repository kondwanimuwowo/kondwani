import type { Metadata } from "next"
import { ogImage, twitterCard } from "@/lib/seo"
import { ProjectsAndCaseStudies } from "@/components/sections/ProjectsAndCaseStudies"
import { db } from "@/lib/db"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Projects",
  description: "Websites, online shops, booking systems, dashboards and web apps designed and built by Kondwani Muwowo for clients in Zambia.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects, Kondwani Muwowo",
    description: "Websites, online shops, booking systems and web apps built for clients in Zambia.",
    url: "/projects",
    images: ogImage("page", "projects", "Projects by Kondwani Muwowo"),
  },
  twitter: twitterCard(ogImage("page", "projects", "Projects by Kondwani Muwowo")),
}

export default async function ProjectsPage() {
  const [projects, caseStudies] = await Promise.all([
    db.query.project.findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { asc }) => asc(t.order) }),
    db.query.caseStudy.findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { asc }) => asc(t.order) }),
  ])

  return (
    <main className="min-h-screen bg-surface pt-32 pb-20">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            All Projects
          </h1>
          <div className="h-1 w-20 bg-primary rounded-full mx-auto mb-6" />
          <p className="text-lg text-muted max-w-2xl mx-auto">
            A full collection of projects, web apps, design work, and nonprofit sites.
          </p>
        </div>
        <ProjectsAndCaseStudies projects={projects} caseStudies={caseStudies} />
      </div>
    </main>
  )
}
