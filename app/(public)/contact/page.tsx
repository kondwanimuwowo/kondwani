import type { Metadata } from "next"
import { ContactForm } from "@/components/sections/ContactForm"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Kondwani Muwowo — available for freelance work, collaborations, and conversations about web development and UI design.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Kondwani Muwowo",
    description: "Get in touch — available for freelance work, collaborations, and conversations.",
    url: "/contact",
  },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background pt-32 pb-20">
      <div className="container-custom max-w-4xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold tracking-widest uppercase text-primary mb-4">Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Let&apos;s Build Something
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary-hover rounded-full mx-auto mb-6" />
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Have a project in mind or just want to say hello? I&apos;m always open to new conversations.
          </p>
        </div>
        <ContactForm />
      </div>
    </main>
  )
}
