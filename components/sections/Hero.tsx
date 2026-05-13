"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "motion/react"
import { GitHub, LinkedIn, Twitter, ArrowDownward } from "@mui/icons-material"
import { PillLink } from "@/components/ui/PillLink"

const socialLinks = [
  { name: "GitHub", href: "https://github.com/kondwanimuwowo", icon: GitHub },
  { name: "LinkedIn", href: "https://linkedin.com/in/kondwanimuwowo", icon: LinkedIn },
  { name: "Twitter / X", href: "https://x.com/kondwanimuwow0", icon: Twitter },
]

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
}

const imageVariant: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, delay: 0.4, ease: "easeOut" },
  },
}

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center bg-background pt-20 overflow-hidden">
      <div className="container-custom w-full py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col"
          >
            {/* Mobile image */}
            <motion.div
              variants={imageVariant}
              initial="hidden"
              animate="show"
              className="lg:hidden mb-8 flex justify-center"
            >
              <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1.55], opacity: [0, 0.14, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", times: [0, 0.3, 1] }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1.55], opacity: [0, 0.1, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", times: [0, 0.3, 1], delay: 0.9 }}
                />
                <Image
                  src="/kondwani.png"
                  alt="Kondwani Muwowo"
                  fill
                  className="object-cover rounded-full shadow-lg ring-1 ring-border ring-offset-4 ring-offset-background relative"
                  priority
                  sizes="(max-width: 640px) 224px, 256px"
                />
              </div>
            </motion.div>



            <motion.h1
              variants={item}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05]"
            >
              <span className="text-primary">Kondwani</span>{" "}
              Muwowo.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 text-lg text-muted max-w-xl leading-relaxed"
            >
              Software Developer, UI Designer — and a fighter against human trafficking and child exploitation.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-10 flex flex-wrap gap-4 items-center"
            >
              <Link
                href="/projects"
                className="bg-foreground text-white px-7 py-3.5 rounded-full font-medium hover:bg-primary transition-colors shadow-sm text-sm"
              >
                View My Work
              </Link>
              <PillLink href="/contact">Get In Touch</PillLink>
            </motion.div>

            <motion.div variants={item} className="mt-8 flex items-center gap-5">
              {socialLinks.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="text-muted hover:text-primary transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </motion.div>
          </motion.div>

          {/* Desktop image column */}
          <motion.div
            variants={imageVariant}
            initial="hidden"
            animate="show"
            className="hidden lg:flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Animated pulse rings */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1.55], opacity: [0, 0.14, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", times: [0, 0.3, 1] }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                animate={{ scale: [1, 1.3, 1.55], opacity: [0, 0.1, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", times: [0, 0.3, 1], delay: 0.9 }}
              />
              <div className="relative w-80 h-80 xl:w-96 xl:h-96">
                <Image
                  src="/kondwani.png"
                  alt="Kondwani Muwowo"
                  fill
                  className="object-cover rounded-full shadow-lg ring-1 ring-border ring-offset-8 ring-offset-background"
                  priority
                  sizes="(max-width: 1280px) 320px, 384px"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
