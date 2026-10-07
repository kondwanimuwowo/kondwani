"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"

interface TiltProps {
  children: ReactNode
  className?: string
  maxTilt?: number
}

const SPRING = { stiffness: 150, damping: 18, mass: 0.6 }

// Leans toward the pointer anywhere on the page. Touch devices and reduced-motion users get a still element.
export function Tilt({ children, className, maxTilt = 10 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateY = useSpring(useTransform(pointerX, [-1, 1], [-maxTilt, maxTilt]), SPRING)
  const rotateX = useSpring(useTransform(pointerY, [-1, 1], [maxTilt, -maxTilt]), SPRING)

  useEffect(() => {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return

    const clamp = (n: number) => Math.max(-1, Math.min(1, n))
    const onMove = (e: PointerEvent) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      // Measured against the viewport so the tilt follows the cursor across the whole screen, not just over the element
      pointerX.set(clamp((e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)))
      pointerY.set(clamp((e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2)))
    }
    const reset = () => {
      pointerX.set(0)
      pointerY.set(0)
    }

    window.addEventListener("pointermove", onMove)
    document.documentElement.addEventListener("pointerleave", reset)
    return () => {
      window.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", reset)
    }
  }, [reduceMotion, pointerX, pointerY])

  return (
    <motion.div ref={ref} style={{ rotateX, rotateY, transformPerspective: 900 }} className={className}>
      {children}
    </motion.div>
  )
}
