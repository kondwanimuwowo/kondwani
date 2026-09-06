"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { OpenInNew, GitHub, Circle, ArrowForward } from "@mui/icons-material"
import type { Project, CaseStudy } from "@/lib/db"
import { getCategoryIcon } from "@/lib/categoryIcon"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

type Tab = "all" | "projects" | "case-studies"

interface Props {
  projects: Project[]
  caseStudies: CaseStudy[]
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      variants={cardVariant}
      whileHover={{ y: -8 }}
      className="relative group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border-2 border-white hover:border-primary transition-all duration-300"
    >
      <Link href={project.slug ? `/projects/${project.slug}` : "#"} className="absolute inset-0 z-0" aria-label={project.title} />
      <div className="relative h-52 overflow-hidden bg-surface">
        <motion.div className="absolute inset-0" whileHover={{ scale: 1.04 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={`${project.title}, built by Kondwani Muwowo using ${project.tech.join(", ")}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}
        </motion.div>
        <div title={project.category} className="absolute bottom-3 left-3 z-10 text-primary drop-shadow-md">
          {(() => { const Icon = getCategoryIcon(project.category); return <Icon sx={{ fontSize: 22 }} /> })()}
        </div>
        {project.status && (
          <div title={project.status} className="absolute top-3 right-3 z-10 drop-shadow-md">
            <Circle className="text-primary animate-pulse" sx={{ fontSize: 8 }} />
          </div>
        )}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">{project.title}</h2>
        <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">{project.excerpt ?? project.description}</p>
        <div className="flex items-center gap-1.5 mb-5 overflow-hidden">
          {project.tech.slice(0, 3).map((t) => (
            <span key={t} className="text-[11px] font-medium bg-surface text-muted px-2.5 py-1 rounded-full whitespace-nowrap">
              {t}
            </span>
          ))}
          {project.tech.length > 3 && (
            <span className="text-[11px] font-medium bg-surface text-muted px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
              +{project.tech.length - 3}
            </span>
          )}
        </div>
        <div className="relative z-10 flex items-center gap-5 pt-4 border-t border-border">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors">
              Live Demo <OpenInNew fontSize="small" />
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
              <GitHub sx={{ fontSize: 16 }} /> Code
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <motion.article
      variants={cardVariant}
      whileHover={{ y: -8 }}
      className="relative group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border-2 border-white hover:border-primary transition-all duration-300"
    >
      <Link href={`/case-studies/${study.slug}`} className="absolute inset-0 z-0" aria-label={study.title} />
      <div className="relative h-52 overflow-hidden bg-surface">
        <motion.div className="absolute inset-0" whileHover={{ scale: 1.04 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          {study.coverImage ? (
            <Image
              src={study.coverImage}
              alt={`${study.title} case study`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-surface" />
          )}
        </motion.div>
        <div title="Case Study" className="absolute bottom-3 left-3 z-10 text-primary drop-shadow-md">
          {(() => { const Icon = getCategoryIcon("case study"); return <Icon sx={{ fontSize: 22 }} /> })()}
        </div>
      </div>
      <div className="p-6">
        {study.client && (
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-1">{study.client}</p>
        )}
        <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">{study.title}</h2>
        <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">{study.excerpt}</p>
        <div className="flex items-center gap-1.5 mb-5 overflow-hidden">
          {study.tech.slice(0, 3).map((t) => (
            <span key={t} className="text-[11px] font-medium bg-surface text-muted px-2.5 py-1 rounded-full whitespace-nowrap">
              {t}
            </span>
          ))}
          {study.tech.length > 3 && (
            <span className="text-[11px] font-medium bg-surface text-muted px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
              +{study.tech.length - 3}
            </span>
          )}
        </div>
        <div className="relative z-10 flex items-center gap-5 pt-4 border-t border-border">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            Read Case Study <ArrowForward sx={{ fontSize: 16 }} />
          </span>
          {study.outcomes.length > 0 && (
            <span className="text-xs text-muted">{study.outcomes.length} outcome{study.outcomes.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function ProjectsAndCaseStudies({ projects, caseStudies }: Props) {
  const [tab, setTab] = useState<Tab>("all")

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: projects.length + caseStudies.length },
    { id: "projects", label: "Projects", count: projects.length },
    { id: "case-studies", label: "Case Studies", count: caseStudies.length },
  ]

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium shadow-md transition-colors flex items-center gap-2 ${
              tab === t.id
                ? "bg-primary text-white"
                : "bg-white text-muted hover:text-primary"
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-primary-hover text-white" : "bg-surface text-muted"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={container}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {(tab === "all" || tab === "projects") && projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {(tab === "all" || tab === "case-studies") && caseStudies.map((s) => (
            <CaseStudyCard key={s.id} study={s} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
