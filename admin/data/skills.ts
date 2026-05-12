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
  "HTML5",
  "CSS3",
  "JavaScript",
  "React",
  "Node.js",
  "PostgreSQL",
  "Tailwind CSS",
  "WordPress",
  "Git",
  "Figma",
  "Adobe CC",
  "Affinity",
  "VS Code",
  "Claude Code",
  "Gemini",
  "GitHub Copilot",
]

export const skillCategories: SkillCategory[] = [
  {
    id: "frontend",
    title: "Frontend",
    icon: "Code",
    skills: [
      { name: "HTML5", level: "Advanced" },
      { name: "CSS3", level: "Advanced" },
      { name: "JavaScript", level: "Advanced" },
      { name: "React", level: "Advanced" },
      { name: "Tailwind CSS", level: "Advanced" },
      { name: "Responsive Design", level: "Advanced" },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    icon: "Storage",
    skills: [
      { name: "Node.js", level: "Intermediate" },
      { name: "PostgreSQL", level: "Intermediate" },
      { name: "REST APIs", level: "Intermediate" },
    ],
  },
  {
    id: "design",
    title: "Design",
    icon: "Palette",
    skills: [
      { name: "Figma", level: "Advanced" },
      { name: "Adobe Suite", level: "Intermediate" },
      { name: "Affinity", level: "Intermediate" },
      { name: "Canva", level: "Advanced" },
      { name: "UI/UX Design", level: "Advanced" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    icon: "Build",
    skills: [
      { name: "Git & GitHub", level: "Advanced" },
      { name: "WordPress", level: "Advanced" },
      { name: "VS Code", level: "Advanced" },
      { name: "Claude Code", level: "Advanced" },
      { name: "Gemini", level: "Intermediate" },
      { name: "GitHub Copilot", level: "Intermediate" },
    ],
  },
]
