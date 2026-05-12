import type { Metadata } from "next"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Skills } from "@/components/sections/Skills"
import { Projects } from "@/components/sections/Projects"
import { BeyondCode } from "@/components/sections/BeyondCode"
import { Contact } from "@/components/sections/Contact"
import { prisma } from "@/lib/prisma"
import { skillCategories, techPills } from "@/data/skills"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kondwani Muwowo — Front-End Developer & UI Designer",
    description:
      "Kondwani Muwowo is a self-taught Front-End Developer and UI Designer from Lusaka, Zambia, building purposeful digital products with React, Next.js, and Tailwind CSS.",
    url: "/",
  },
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Kondwani Muwowo",
  jobTitle: "Front-End Developer & UI Designer",
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
        text: "Kondwani Muwowo is a self-taught Front-End Developer and UI Designer based in Lusaka, Zambia. He builds clean, thoughtful digital experiences using React, Next.js, and Tailwind CSS, and is also involved in fighting human trafficking through TAKUZA.",
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

async function getSkillsData() {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: "skills" } })
    if (config) return JSON.parse(config.value)
  } catch {}
  return { skillCategories, techPills }
}

export default async function Home() {
  const skillsData = await getSkillsData()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="flex flex-col min-h-screen">
        <Hero />
        <About />
        <Skills techPills={skillsData.techPills} skillCategories={skillsData.skillCategories} />
        <Projects />
        <BeyondCode />
        <Contact />
      </div>
    </>
  )
}
