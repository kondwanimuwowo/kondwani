import type { Metadata } from "next"
import { Hero } from "@/components/sections/Hero"
import { About } from "@/components/sections/About"
import { Skills } from "@/components/sections/Skills"
import { Projects } from "@/components/sections/Projects"
import { BeyondCode } from "@/components/sections/BeyondCode"
import { Contact } from "@/components/sections/Contact"
import { db } from "@/lib/db"
import { skillCategories, techPills } from "@/data/skills"
import { SITE, SERVICES } from "@/data/site"
import { ogImage, siteGraphJsonLd, twitterCard } from "@/lib/seo"

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: "/",
    images: ogImage("page", "home", SITE.title),
  },
  twitter: twitterCard(ogImage("page", "home", SITE.title)),
}

// Mirrors questions people ask about hiring a web designer, phrased the way answer engines quote them
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      q: "Who is Kondwani Muwowo?",
      a: "Kondwani Muwowo is a web designer and developer in Lusaka, Zambia. He builds websites and web systems for businesses, churches and nonprofits.",
    },
    {
      q: "What does Kondwani Muwowo build?",
      a: `${SERVICES.map((s) => s.name).join(", ")}. Recent work includes a multi-tenant ERP and marketplace for tailoring businesses, a booking and escrow payment platform for a Lusaka property agent, and websites for TAKUZA and Teleiosis Mandate.`,
    },
    {
      q: "Can Kondwani Muwowo take mobile money payments on a website?",
      a: "Yes. His online shops, booking systems and donation pages take mobile money and card payments through Lenco, and each payment is confirmed automatically before an order or booking goes through.",
    },
    {
      q: "How do I hire Kondwani Muwowo for a website?",
      a: "Send a message through the contact page at kondwanimuwowo.com/contact describing what you need. He offers a free 15-minute consultation to scope the project.",
    },
  ].map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraphJsonLd()) }} />
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
