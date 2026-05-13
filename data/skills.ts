export interface Skill {
  name: string
  level: "Advanced" | "Intermediate" | "Learning"
}

export interface SkillCategory {
  id: string
  title: string
  icon: string
  skills: Skill[]
}

export const techPills = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Prisma",
  "Supabase",
  "Tailwind CSS",
  "Framer Motion",
  "Git",
  "Figma",
  "VS Code",
  "Claude Code",
  "GitHub Copilot",
]

export const skillCategories: SkillCategory[] = [
  {
    id: "frontend",
    title: "Frontend",
    icon: "Code",
    skills: [
      { name: "TypeScript", level: "Advanced" },
      { name: "React 19", level: "Advanced" },
      { name: "Next.js 15", level: "Advanced" },
      { name: "Tailwind CSS", level: "Advanced" },
      { name: "Framer Motion", level: "Advanced" },
      { name: "shadcn/ui", level: "Advanced" },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    icon: "Storage",
    skills: [
      { name: "Node.js", level: "Intermediate" },
      { name: "Express.js", level: "Intermediate" },
      { name: "REST APIs", level: "Intermediate" },
      { name: "PostgreSQL", level: "Intermediate" },
      { name: "Prisma ORM", level: "Intermediate" },
      { name: "Supabase", level: "Intermediate" },
    ],
  },
  {
    id: "design",
    title: "Design",
    icon: "Palette",
    skills: [
      { name: "Figma", level: "Advanced" },
      { name: "UI/UX Design", level: "Advanced" },
      { name: "Adobe Suite", level: "Intermediate" },
      { name: "Affinity", level: "Intermediate" },
    ],
  },
  {
    id: "tools",
    title: "Tools & AI",
    icon: "Build",
    skills: [
      { name: "Git & GitHub", level: "Advanced" },
      { name: "VS Code", level: "Advanced" },
      { name: "Claude Code", level: "Advanced" },
      { name: "GitHub Copilot", level: "Advanced" },
      { name: "Gemini", level: "Intermediate" },
      { name: "WordPress", level: "Advanced" },
    ],
  },
]
