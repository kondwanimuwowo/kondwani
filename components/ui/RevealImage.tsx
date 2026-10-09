"use client"

import { motion, useReducedMotion } from "motion/react"
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
export function RevealImage({ children, className, delay = 0 }: RevealImageProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }}
      whileInView={reduceMotion ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: EASE_IN_OUT, delay }}
    >
      {children}
    </motion.div>
  )
}
