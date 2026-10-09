"use client"

import { motion } from "motion/react"
import { ReactNode } from "react"

interface AnimateInProps {
  children: ReactNode
  delay?: number
  className?: string
  direction?: "up" | "down" | "left" | "right" | "none"
}

export function AnimateIn({ children, delay = 0, className, direction = "up" }: AnimateInProps) {
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 }
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
