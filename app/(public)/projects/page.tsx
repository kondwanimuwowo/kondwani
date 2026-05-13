import type { Metadata } from "next"
import { ProjectsGrid } from "@/components/sections/ProjectsGrid"

export const metadata: Metadata = {
  title: "Projects",
  description: "Web apps, design work, and nonprofit websites by Kondwani Muwowo — a Software Developer and UI Designer based in Lusaka, Zambia.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects — Kondwani Muwowo",
    description: "Web apps, design work, and nonprofit websites by Kondwani Muwowo.",
    url: "/projects",
  },
}

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-primary mb-4">Work</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            All Projects
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary-hover rounded-full mx-auto mb-6" />
          <p className="text-lg text-muted max-w-2xl mx-auto">
            A full collection of projects — web apps, design work, and nonprofit sites.
          </p>
        </div>
        <ProjectsGrid />
      </div>
    </main>
  )
}
