"use client"

import { motion } from "motion/react"
import { useReveal } from "@/hooks/useReveal"
import { PillLink } from "@/components/ui/PillLink"

export function Contact() {
  const { ref, revealed } = useReveal()

  return (
    <section id="contact" className="bg-surface" style={{ paddingTop: "8rem", paddingBottom: "8rem" }}>
      <div className="container-custom">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center gap-6 bg-white border border-border rounded-2xl px-10 py-16 md:px-16 md:py-16 shadow-sm max-w-4xl mx-auto w-full"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Let&apos;s work together
          </h2>
          <p className="text-muted text-lg max-w-xl leading-relaxed">
            I&apos;m open to work, collaborations, and conversations. Whether it&apos;s a website, a design challenge, or just an idea, let&apos;s talk.
          </p>
          <PillLink href="/contact">Get in Touch</PillLink>
        </motion.div>
      </div>
    </section>
  )
}
