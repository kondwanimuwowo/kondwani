"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { OpenInNew, GitHub, Circle } from "@mui/icons-material"
import type { Project } from "@/lib/db"
import { getCategoryIcon } from "@/lib/categoryIcon"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState("All")
  const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))]
  const filtered = active === "All" ? projects : projects.filter((p) => p.category === active)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium shadow-md transition-colors ${
              active === cat
                ? "bg-primary text-white"
                : "bg-white text-muted hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        key={active}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filtered.map((project) => (
          <motion.article
            key={project.id}
            variants={cardVariant}
            whileHover={{ y: -8 }}
            className="relative group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300"
          >
            {/* Stretched link covers the whole card */}
            <Link href={project.slug ? `/projects/${project.slug}` : "#"} className="absolute inset-0 z-0" aria-label={project.title} />

            {/* Image */}
            <div className="relative h-52 overflow-hidden bg-surface">
              <motion.div
                className="absolute inset-0"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
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
              <div title={project.category} className="absolute bottom-3 left-3 z-10 w-9 h-9 flex items-center justify-center bg-foreground text-white rounded-full">
                {(() => { const Icon = getCategoryIcon(project.category); return <Icon sx={{ fontSize: 18 }} /> })()}
              </div>
              {project.status && (
                <div title={project.status} className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-foreground rounded-full">
                  <Circle className="text-primary animate-pulse" sx={{ fontSize: 10 }} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                {project.title}
              </h2>
              <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">
                {project.excerpt ?? project.description}
              </p>
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
              {/* External links sit above the stretched link */}
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
        ))}
      </motion.div>
    </div>
  )
}
