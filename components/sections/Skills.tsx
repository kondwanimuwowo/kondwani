"use client"

import { motion, type Variants } from "motion/react"
import { Code, Storage, Palette, Build } from "@mui/icons-material"
import {
  SiHtml5, SiCss, SiJavascript, SiTypescript, SiReact, SiNextdotjs,
  SiNodedotjs, SiExpress, SiPostgresql, SiPrisma, SiSupabase,
  SiTailwindcss, SiFramer, SiWordpress, SiGit, SiFigma,
  SiAffinity, SiClaude, SiGooglegemini, SiGithubcopilot,
} from "react-icons/si"
import { VscVscode } from "react-icons/vsc"
import { skillCategories as defaultCategories, techPills as defaultPills } from "@/data/skills"
import type { SkillCategory } from "@/data/skills"
import { useReveal } from "@/hooks/useReveal"
import type { IconType } from "react-icons"

const muiIconMap: Record<string, React.ElementType> = {
  Code,
  Storage,
  Palette,
  Build,
}

const pillIconMap: Record<string, IconType> = {
  "HTML5": SiHtml5,
  "CSS3": SiCss,
  "JavaScript": SiJavascript,
  "TypeScript": SiTypescript,
  "React": SiReact,
  "Next.js": SiNextdotjs,
  "Node.js": SiNodedotjs,
  "Express": SiExpress,
  "PostgreSQL": SiPostgresql,
  "Prisma": SiPrisma,
  "Supabase": SiSupabase,
  "Tailwind CSS": SiTailwindcss,
  "Framer Motion": SiFramer,
  "WordPress": SiWordpress,
  "Git": SiGit,
  "Figma": SiFigma,
  "Affinity": SiAffinity,
  "VS Code": VscVscode,
  "Claude Code": SiClaude,
  "Gemini": SiGooglegemini,
  "GitHub Copilot": SiGithubcopilot,
}


const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
}

interface SkillsProps {
  techPills?: string[]
  skillCategories?: SkillCategory[]
}

export function Skills({ techPills = defaultPills, skillCategories = defaultCategories }: SkillsProps) {
  const { ref, revealed } = useReveal()

  return (
    <section id="skills" className="section-padding bg-surface">
      <motion.div ref={ref} className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Tech Stack
          </h2>
          <motion.div
            className="h-1 w-20 bg-gradient-to-r from-primary to-primary-hover rounded-full mx-auto"
            initial={{ scaleX: 0 }}
            animate={revealed ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>

        {/* Tech pills */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {techPills.map((tech) => {
            const Icon = pillIconMap[tech]
            return (
              <motion.span
                key={tech}
                variants={fadeUp}
                whileHover={{ scale: 1.1, y: -4 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-full text-sm font-medium text-foreground shadow-sm cursor-default hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {Icon && <Icon size={16} className="text-primary" />}
                {tech}
              </motion.span>
            )
          })}
        </motion.div>

        {/* Category grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {skillCategories.map((category) => {
            const Icon = muiIconMap[category.icon]
            return (
              <motion.div
                key={category.id}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="relative group overflow-hidden bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
              >
                {/* Watermark icon */}
                <div className="absolute right-3 bottom-3 pointer-events-none select-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
                  {Icon && <Icon sx={{ fontSize: 140 }} className="text-foreground" />}
                </div>

                <div className="relative z-10">
                  {/* Icon + Title row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {Icon && <Icon className="text-primary" fontSize="small" />}
                    </div>
                    <h3 className="font-bold text-foreground/60 text-base leading-tight">
                      {category.title}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {category.skills.map((skill) => (
                      <li key={skill.name} className="text-sm text-foreground/80">
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
