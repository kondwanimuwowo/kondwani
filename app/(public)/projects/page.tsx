import type { Metadata } from "next"
import { ProjectsAndCaseStudies } from "@/components/sections/ProjectsAndCaseStudies"
import { db } from "@/lib/db"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Projects",
  description: "Web apps, design work, and nonprofit websites by Kondwani Muwowo, a Software Developer and UI Designer based in Lusaka, Zambia.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects — Kondwani Muwowo",
    description: "Web apps, design work, and nonprofit websites by Kondwani Muwowo.",
    url: "/projects",
  },
}

export default async function ProjectsPage() {
  const [projects, caseStudies] = await Promise.all([
    db.query.project.findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { asc }) => asc(t.order) }),
    db.query.caseStudy.findMany({ where: (t, { eq }) => eq(t.published, true), orderBy: (t, { asc }) => asc(t.order) }),
  ])

  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
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
