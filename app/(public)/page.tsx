import type { Metadata } from "next"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Skills } from "@/components/sections/Skills"
import { Projects } from "@/components/sections/Projects"
import { BeyondCode } from "@/components/sections/BeyondCode"
import { Contact } from "@/components/sections/Contact"
import { db } from "@/lib/db"
import { skillCategories, techPills } from "@/data/skills"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kondwani Muwowo — Software Developer & UI Designer",
    description:
      "Kondwani Muwowo is a self-taught Software Developer and UI Designer from Lusaka, Zambia, building purposeful digital products with React, Next.js, and Tailwind CSS.",
    url: "/",
  },
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kondwani Muwowo",
  jobTitle: "Software Developer & UI Designer",
  url: "https://kondwanimuwowo.com",
  sameAs: [
    "https://github.com/kondwanimuwowo",
    "https://linkedin.com/in/kondwanimuwowo",
    "https://x.com/kondwanimuwow0",
  ],
  knowsAbout: ["React", "Next.js", "UI Design", "Tailwind CSS", "TypeScript", "PostgreSQL"],
  address: { "@type": "PostalAddress", addressLocality: "Lusaka", addressCountry: "ZM" },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is Kondwani Muwowo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kondwani Muwowo is a self-taught Software Developer and UI Designer based in Lusaka, Zambia. He builds clean, thoughtful digital experiences using React, Next.js, and Tailwind CSS, and is also involved in fighting human trafficking through TAKUZA.",
      },
    },
    {
      "@type": "Question",
      name: "What does Kondwani Muwowo build?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kondwani builds purposeful web applications and digital products — from client-facing marketing sites to SaaS platforms — with a focus on clean UI, smooth interactions, and solid front-end engineering.",
      },
    },
    {
      "@type": "Question",
      name: "Is Kondwani Muwowo available for freelance work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Kondwani is open to freelance projects, collaborations, and full-time opportunities. You can reach him through the contact page on his portfolio.",
      },
    },
  ],
}

async function getHomeData() {
  const [skillsConfig, featuredProjects] = await Promise.all([
    db.query.siteConfig.findFirst({ where: (t, { eq }) => eq(t.key, "skills") }).catch(() => null),
    db.query.project.findMany({
      where: (t, { eq, and }) => and(eq(t.published, true), eq(t.featured, true)),
      orderBy: (t, { asc }) => asc(t.order),
      limit: 3,
    }).catch(() => []),
  ])
  const skillsData = skillsConfig ? JSON.parse(skillsConfig.value) : { skillCategories, techPills }
  return { skillsData, featuredProjects }
}

export default async function Home() {
  const { skillsData, featuredProjects } = await getHomeData()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="flex flex-col min-h-screen">
        <Hero />
        <About />
        <Skills techPills={skillsData.techPills} skillCategories={skillsData.skillCategories} />
        <Projects projects={featuredProjects} />
        <BeyondCode />
        <Contact />
      </div>
    </>
  )
}
