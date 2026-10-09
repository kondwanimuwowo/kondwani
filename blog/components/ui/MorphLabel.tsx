"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

export type MorphState = "idle" | "loading" | "sent"

interface MorphLabelProps {
  state: MorphState
  idle: ReactNode
  loading: ReactNode
  sent: ReactNode
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Button content that crossfades between states. The brief blur blends the outgoing and incoming
// labels into one change instead of two objects swapping.
export function MorphLabel({ state, idle, loading, sent }: MorphLabelProps) {
  const reduceMotion = useReducedMotion()
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }

  return (
    <span className="relative inline-flex items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="inline-flex items-center gap-2 whitespace-nowrap"
          initial={hidden}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={hidden}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        >
          {state === "idle" ? idle : state === "loading" ? loading : sent}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function Spinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <span aria-hidden className={`${className} animate-spin rounded-full border-2 border-white/30 border-t-white`} />
}
