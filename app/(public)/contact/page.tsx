import type { Metadata } from "next"
import { ogImage, twitterCard } from "@/lib/seo"
import { ContactForm } from "@/components/sections/ContactForm"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Kondwani Muwowo about a website, online shop, booking system or web app. Free 15-minute consultation.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Kondwani Muwowo",
    description: "Tell me about the website or system you need built. Free 15-minute consultation.",
    url: "/contact",
    images: ogImage("page", "contact", "Contact Kondwani Muwowo"),
  },
  twitter: twitterCard(ogImage("page", "contact", "Contact Kondwani Muwowo")),
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container-custom max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Let&apos;s Build Something
          </h1>
          <div className="h-1 w-20 bg-primary rounded-full mx-auto mb-6" />
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Have a project in mind or just want to say hello? I&apos;m always open to new conversations.
          </p>
        </div>
        <ContactForm />
      </div>
    </main>
  )
}
