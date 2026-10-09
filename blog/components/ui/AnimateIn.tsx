"use client"

import { motion, useReducedMotion } from "motion/react"
import { ReactNode } from "react"

interface AnimateInProps {
  children: ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "left" | "right" | "none"
}

// Strong ease-out: starts fast so the page feels responsive, then settles gently
const EASE_OUT = [0.23, 1, 0.32, 1] as const
const DISTANCE = 12

const offsets = {
  up: { y: DISTANCE },
  down: { y: -DISTANCE },
  left: { x: DISTANCE },
  right: { x: -DISTANCE },
  none: {},
}

export function AnimateIn({ children, delay = 0, className, direction = "up" }: AnimateInProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)", ...offsets[direction] }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        filter: "blur(0px)",
        // A leftover filter would trap fixed-position children (like the lightbox) inside this element
        transitionEnd: { filter: "none" },
      }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
