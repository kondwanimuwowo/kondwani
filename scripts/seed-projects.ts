import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env" })

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const projects = [
  {
    slug: "gloriaz-daughter-erp",
    title: "Gloriaz Daughter ERP",
    excerpt: "A full ERP system for a fashion and tailoring business — covering inventory, orders, payroll, and CRM.",
    description: "Comprehensive ERP system built for a fashion house and tailoring business. Manages the full business lifecycle — from inventory and material tracking to order management, employee time tracking, and customer relationships.",
    tech: ["TypeScript", "React 19", "Vite", "Supabase", "PostgreSQL", "Tailwind CSS"],
    category: "Web App",
    role: "Lead Developer",
    year: 2025,
    status: "In Progress",
    featured: true,
    order: 1,
    published: true,
  },
  {
    slug: "smile-enterprise-pos",
    title: "Smile Enterprise POS",
    excerpt: "A full-stack POS and inventory management system built for Zambian grocery and retail businesses.",
    description: "Full-stack Point of Sale and Inventory Management system with 16% ZRA VAT compliance, role-based access control, and ZRA-friendly receipt generation. Offline-capable via SQLite.",
    tech: ["TypeScript", "React", "Node.js", "Express", "Prisma", "SQLite", "Tailwind CSS", "Framer Motion"],
    category: "Web App",
    role: "Lead Developer",
    year: 2025,
    status: "Completed",
    featured: true,
    order: 2,
    published: true,
  },
  {
    slug: "hoha-dashboard",
    title: "HOHA Dashboard",
    excerpt: "A multi-module internal dashboard covering education, legacy, clinical care, and food distribution.",
    description: "Multi-module internal dashboard for the HOHA organisation covering four operational areas — Educare, Legacy, Clinicare, and Food Distribution — all under one authenticated shell.",
    tech: ["React 19", "Vite", "Supabase", "Tailwind CSS", "shadcn/ui"],
    category: "Dashboard",
    role: "Lead Developer",
    year: 2025,
    status: "In Progress",
    featured: true,
    order: 3,
    published: true,
  },
  {
    slug: "ulendo-institute",
    title: "Ulendo Institute",
    excerpt: "A subscription-based course platform with Lenco payments, JWT auth, and SSR for SEO.",
    description: "Subscription-based course platform for leadership, personal development, and creative skills. Features plan-based subscriptions with Lenco payment integration, instructor approval workflow, and SSR for SEO.",
    tech: ["Next.js 14", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS", "JWT", "Lenco Payments", "SendGrid"],
    category: "Web App",
    role: "Lead Developer",
    year: 2025,
    status: "In Progress",
    featured: true,
    order: 4,
    published: true,
  },
  {
    slug: "lji-digital-forms",
    title: "LJI Digital Forms",
    excerpt: "A digital field data collection app for Love Justice International anti-trafficking monitors.",
    description: "Field data collection web app for Love Justice International transit monitors. Replaces paper forms with digital equivalents for recording human trafficking interceptions at border crossings and transit hubs.",
    tech: ["React", "Vite", "TypeScript", "Tailwind CSS", "shadcn/ui", "Framer Motion"],
    category: "Web App",
    role: "Developer & Designer",
    year: 2025,
    status: "Completed",
    featured: true,
    order: 5,
    published: true,
  },
  {
    slug: "ymsl-lms",
    title: "YMSL LMS",
    excerpt: "A Learning Management System with courses, quizzes, community, and an admin panel.",
    description: "Learning Management System built for YMSL. Includes dashboard, courses, lessons, quizzes, community features, and an admin panel — all backed by Supabase.",
    tech: ["React", "Vite", "Supabase", "TypeScript"],
    category: "Web App",
    role: "Lead Developer",
    year: 2025,
    status: "In Progress",
    featured: false,
    order: 6,
    published: true,
  },
  {
    slug: "elevate-capital-website",
    title: "Elevate Capital",
    excerpt: "A production marketing website for Elevate Capital with smooth animations and responsive design.",
    description: "Production marketing website for Elevate Capital. Fully responsive with smooth page transitions and animations derived from PDF-provided brand content.",
    tech: ["React 18", "Vite", "Tailwind CSS", "Framer Motion", "React Router"],
    category: "Website",
    role: "Developer",
    year: 2024,
    status: "Completed",
    featured: false,
    order: 7,
    published: true,
  },
  {
    slug: "velocity-city-church",
    title: "Velocity City Church",
    excerpt: "A clean, responsive church website for Velocity City Church.",
    description: "Church website for Velocity City Church built with React 19 and Tailwind CSS.",
    tech: ["React 19", "Vite", "Tailwind CSS"],
    category: "Website",
    role: "Developer",
    year: 2025,
    status: "Completed",
    featured: false,
    order: 8,
    published: true,
  },
  {
    slug: "hytech-ultra-equipment",
    title: "Hytech Ultra Equipment Zambia",
    excerpt: "Corporate website for Hytech Ultra Equipment Zambia Limited with a SendGrid contact form.",
    description: "Corporate website for Hytech Ultra Equipment Zambia Limited with contact form powered by SendGrid.",
    tech: ["React 19", "Vite", "Tailwind CSS", "SendGrid"],
    category: "Website",
    role: "Developer",
    year: 2025,
    status: "Completed",
    featured: false,
    order: 9,
    published: true,
  },
  {
    slug: "kangasa-beauty-hub",
    title: "Kangasa Beauty Hub",
    excerpt: "A beauty hub website with AI-assisted features powered by the Gemini API.",
    description: "Beauty hub website with AI-assisted features via the Gemini API.",
    tech: ["React 19", "Vite", "Tailwind CSS", "Gemini API"],
    category: "Website",
    role: "Developer",
    year: 2025,
    status: "Completed",
    featured: false,
    order: 10,
    published: true,
  },
  {
    slug: "great-achievers-network",
    title: "The Great Achievers Network",
    excerpt: "The digital home for GAN — a nonprofit supporting vulnerable girls in Zambia through education and mentorship.",
    description: "The digital home for GAN — a nonprofit supporting vulnerable girls in Zambia through education and mentorship. Built and maintained as a volunteer developer and designer.",
    tech: ["React 18", "Vite", "Tailwind CSS"],
    liveUrl: "https://greatachieversnetwork.org",
    category: "Website",
    role: "Volunteer Developer & Designer",
    year: 2024,
    status: "Live",
    featured: false,
    order: 11,
    published: true,
  },
  {
    slug: "kuwala-weather-app",
    title: "Kuwala Weather App",
    excerpt: "A fast weather app using the Visual Crossing API with unit toggle and real-time conditions.",
    description: "Fast and efficient weather application using Visual Crossing API. Features current weather conditions, humidity, wind speed, and unit toggle functionality.",
    tech: ["HTML5", "CSS3", "JavaScript", "Visual Crossing API"],
    liveUrl: "https://kondwanimuwowo.github.io/weather-app",
    githubUrl: "https://github.com/kondwanimuwowo/weather-app",
    category: "Web App",
    role: "Developer",
    year: 2023,
    status: "Live",
    featured: false,
    order: 12,
    published: true,
  },
]

async function main() {
  console.log("Seeding projects...")

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    })
    console.log(`✓ ${project.title}`)
  }

  console.log(`\nDone — ${projects.length} projects seeded.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
