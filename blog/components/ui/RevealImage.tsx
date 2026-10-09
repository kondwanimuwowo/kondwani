"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"
import type { ReactNode } from "react"

interface RevealImageProps {
  children: ReactNode
  className?: string
  delay?: number
}

// Strong ease-in-out: the wipe accelerates, then lands softly
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

// Unfolds an image top to bottom with a clip mask the first time it scrolls into view.
// Put it inside the shadowed/rounded container: the clip would otherwise cut off the shadow.
// The outer element is what's observed: browsers report a clipped-shut element as not visible,
// so observing the clipped element itself would never trigger the reveal.
export function RevealImage({ children, className, delay = 0 }: RevealImageProps) {
  const reduceMotion = useReducedMotion()

  const inner: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.3, delay } } }
    : {
        hidden: { clipPath: "inset(0% 0% 100% 0%)" },
        shown: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.9, ease: EASE_IN_OUT, delay } },
      }

  return (
    <motion.div className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "-60px" }}>
      <motion.div variants={inner} className="h-full w-full">
        {children}
      </motion.div>
    </motion.div>
  )
}
