"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { OpenInNew, GitHub, Circle } from "@mui/icons-material"
import type { Project } from "@/lib/db"
import { useReveal } from "@/hooks/useReveal"
import { PillLink } from "@/components/ui/PillLink"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
}

export function Projects({ projects }: { projects: Project[] }) {
  const { ref, revealed } = useReveal()
  const featured = projects

  return (
    <section id="projects" className="section-padding bg-background">
      <motion.div ref={ref} className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Featured Projects
          </h2>
          <motion.div
            className="h-1 w-20 bg-primary rounded-full mx-auto"
            initial={{ scaleX: 0 }}
            animate={revealed ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
            A selection of work that solves real problems.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {featured.map((project) => (
            <motion.article
              key={project.id}
              variants={cardVariant}
              whileHover={{ y: -8 }}
              className="relative group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300"
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
                <div className="absolute bottom-3 left-3 text-[10px] font-bold tracking-widest uppercase text-white bg-foreground px-3 py-1.5 rounded-full">
                  {project.category}
                </div>
                {project.status && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-foreground text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                    <Circle className="text-primary animate-pulse" sx={{ fontSize: 8 }} />
                    {project.status}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {project.title}
                </h3>
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
                <div className="relative z-10 flex items-center gap-5 pt-4">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Live Demo <OpenInNew fontSize="small" />
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
                    >
                      <GitHub sx={{ fontSize: 16 }} /> Code
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex justify-center"
        >
          <PillLink href="/projects">View All Projects</PillLink>
        </motion.div>
      </motion.div>
    </section>
  )
}
