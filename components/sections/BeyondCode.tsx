"use client"

import Image from "next/image"
import { motion, type Variants } from "motion/react"
import { OpenInNew, FitnessCenter, Casino, Circle } from "@mui/icons-material"
import { organizations, lifestyle } from "@/data/beyondCode"
import { useReveal } from "@/hooks/useReveal"
import { PillLink } from "@/components/ui/PillLink"

const iconMap: Record<string, React.ElementType> = { FitnessCenter, Casino }

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
}

export function BeyondCode() {
  const { ref, revealed } = useReveal()

  return (
    <section id="beyond-code" className="section-padding bg-background">
      <motion.div ref={ref} className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Purpose-Driven Work
          </h2>
          <motion.div
            className="h-1 w-20 bg-gradient-to-r from-primary to-primary-hover rounded-full mx-auto"
            initial={{ scaleX: 0 }}
            animate={revealed ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto">
            My work and impact outside of development.
          </p>
        </motion.div>

        {/* Org cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
        >
          {organizations.map((org) => (
            <motion.div
              key={org.id}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="relative group overflow-hidden bg-white border border-border rounded-2xl shadow-sm grayscale hover:grayscale-0 hover:border-primary/30 hover:shadow-xl transition-all duration-500 flex flex-col min-h-[280px]"
            >
              {/* Logo watermark */}
              {org.logo && (
                <div className="absolute -right-6 -bottom-6 w-52 h-52 opacity-[0.07] group-hover:opacity-[0.13] transition-opacity duration-500 pointer-events-none select-none">
                  <Image src={org.logo} alt="" fill className="object-contain" sizes="208px" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 p-6 flex flex-col flex-1">
                {/* Small logo */}
                {org.logo ? (
                  <div className="relative w-10 h-10 mb-4 shrink-0">
                    <Image src={org.logo} alt={org.title} fill className="object-contain" sizes="40px" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mb-4">
                    <span className="text-primary font-bold">{org.title[0]}</span>
                  </div>
                )}

                <h3 className="font-bold text-foreground text-base leading-tight mb-0.5">{org.title}</h3>
                <p className="text-xs text-muted mb-4">{org.subtitle}</p>

                <p className="text-sm text-muted leading-relaxed flex-1">{org.description}</p>

                {/* Partner */}
                {org.partnerName && (
                  <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border">
                    {org.partnerLogo && (
                      <div className="relative w-4 h-4 rounded overflow-hidden shrink-0">
                        <Image src={org.partnerLogo} alt={org.partnerName} fill className="object-contain" sizes="16px" />
                      </div>
                    )}
                    <p className="text-[11px] text-muted">In partnership with {org.partnerName}</p>
                  </div>
                )}

                {/* Status + link */}
                {(org.status || org.link) && (
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                    {org.status && (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                        <Circle className="text-primary animate-pulse" sx={{ fontSize: 7 }} />
                        {org.status}
                      </span>
                    )}
                    {org.link && (
                      <a
                        href={org.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors ml-auto"
                      >
                        Visit site <OpenInNew sx={{ fontSize: 13 }} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Lifestyle pills */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="flex flex-wrap gap-3 mb-12"
        >
          {lifestyle.map((item) => {
            const Icon = iconMap[item.icon]
            return (
              <motion.div
                key={item.label}
                variants={fadeUp}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2.5 bg-white border border-border rounded-full px-5 py-3 shadow-sm cursor-default"
              >
                {Icon && <Icon className="text-primary" sx={{ fontSize: 18 }} />}
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center"
        >
          <PillLink href="/beyond-code">Learn More</PillLink>
        </motion.div>
      </motion.div>
    </section>
  )
}
