"use client"

import { useState } from "react"
import { motion, type Variants, AnimatePresence } from "motion/react"
import { ExpandMore, ExpandLess } from "@mui/icons-material"
import { useCountUp } from "@/hooks/useCountUp"
import { useReveal } from "@/hooks/useReveal"

const stats = [
  { label: "Clients Served", value: 5, suffix: "+" },
  { label: "Technologies Used", value: 10, suffix: "+" },
  { label: "Months Coding", value: 12, suffix: "+" },
  { label: "Client Satisfaction", value: 100, suffix: "%" },
]

function StatItem({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-primary">
        {count}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
}

export function About() {
  const [expanded, setExpanded] = useState(false)
  const { ref, revealed } = useReveal()

  return (
    <section id="about" className="section-padding bg-surface">
      <motion.div
        ref={ref}
        variants={container}
        initial="hidden"
        animate={revealed ? "show" : "hidden"}
        className="container-custom"
      >
        <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div variants={fadeUp} className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            About Me
          </h2>
          <motion.div
            className="h-1 w-20 bg-gradient-to-r from-primary to-primary-hover rounded-full mx-auto"
            initial={{ scaleX: 0 }}
            animate={revealed ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>

        <div>
          {/* Bio */}
          <motion.p variants={fadeUp} className="text-lg text-muted leading-relaxed">
            I&apos;m{" "}
            <span className="font-semibold text-primary">Kondwani Muwowo</span>, a
            self-taught Software Developer and UI Designer based in Lusaka, Zambia. I started
            building websites with WordPress, discovered real coding in 2024, and instantly fell in
            love — since then I&apos;ve been pushing myself to build digital products that are both
            beautiful and purposeful.
          </motion.p>

          {/* Expandable content */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-6 text-lg text-muted leading-relaxed">
                  <p>
                    My time in ministry leadership shaped how I think, communicate, and work with
                    others — it taught me depth, discipline, and compassion. I still carry that same
                    heart today, both in the way I approach my craft and in the humanitarian work I do.
                  </p>
                  <p>
                    I fight human trafficking with{" "}
                    <span className="text-foreground/70 font-medium">TAKUZA (Talitha Kum Zambia)</span>{" "}
                    under the Love Justice International Project, intercepting potential victims at
                    border crossings and transit hubs before they can be exploited. It&apos;s work that
                    reminds me every day why impact matters.
                  </p>
                  <p>
                    I also volunteer as developer and designer for{" "}
                    <span className="text-foreground/70 font-medium">The Great Achievers Network (GAN)</span>,
                    a nonprofit supporting vulnerable girls in Zambia with education, mentorship, and
                    practical skills.
                  </p>
                  <p className="font-medium text-foreground/70">
                    Faith, technology, and impact — and I&apos;m just getting started.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Read more toggle */}
          <motion.button
            variants={fadeUp}
            onClick={() => setExpanded((v) => !v)}
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            {expanded ? (
              <>Show less <ExpandLess fontSize="small" /></>
            ) : (
              <>Read more <ExpandMore fontSize="small" /></>
            )}
          </motion.button>
        </div>

        {/* Stats */}
        <motion.div
          variants={fadeUp}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-border pt-12"
        >
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
