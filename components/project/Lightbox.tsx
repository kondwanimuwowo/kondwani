"use client"

import { useEffect } from "react"
import Image from "next/image"
import { AnimatePresence, motion } from "motion/react"
import { useLenis } from "lenis/react"
import { useReducedMotion } from "motion/react"
import { ArrowBack, ArrowForward, Close } from "@mui/icons-material"

interface LightboxProps {
  images: string[]
  index: number | null
  alt: string
  onIndexChange: (index: number | null) => void
  // Viewport point the lightbox grows out of and shrinks back into (centre of the clicked image)
  origin?: { x: number; y: number } | null
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function Lightbox({ images, index, alt, onIndexChange, origin }: LightboxProps) {
  const lenis = useLenis()
  const reduceMotion = useReducedMotion()
  const open = index !== null
  const count = images.length

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    document.documentElement.style.overflow = "hidden"
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ""
    }
  }, [open, lenis])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndexChange(null)
      if (e.key === "ArrowRight") onIndexChange((index + 1) % count)
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + count) % count)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, count, onIndexChange])

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt}, image ${index + 1} of ${count}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
          className="fixed inset-0 z-[60] bg-foreground"
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.9)" }}
            animate={{ opacity: 1, transform: "scale(1)", transition: { duration: 0.4, ease: EASE_OUT } }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.9)", transition: { duration: 0.2, ease: EASE_OUT } }}
            style={{ transformOrigin: origin ? `${origin.x}px ${origin.y}px` : "50% 50%" }}
            className="absolute inset-0 flex flex-col"
          >
          <div className="flex shrink-0 items-center justify-between px-4 py-4 md:px-8">
            <span className="text-sm tabular-nums text-muted-dark">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => onIndexChange(null)}
              aria-label="Close"
              className="rounded-full bg-subtle-dark p-2 text-white transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:bg-primary"
            >
              <Close sx={{ fontSize: 20 }} />
            </button>
          </div>

          <div key={index} data-lenis-prevent className="flex-1 overflow-y-auto px-4 pb-8 md:px-24">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mx-auto max-w-6xl overflow-hidden rounded-3xl"
            >
              <Image
                src={images[index]}
                alt={`${alt}, image ${index + 1}`}
                width={1920}
                height={1080}
                sizes="(max-width: 1280px) 100vw, 1152px"
                className="h-auto w-full"
              />
            </motion.div>
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => onIndexChange((index - 1 + count) % count)}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-subtle-dark p-3 text-white transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:bg-primary md:block"
              >
                <ArrowBack sx={{ fontSize: 20 }} />
              </button>
              <button
                type="button"
                onClick={() => onIndexChange((index + 1) % count)}
                aria-label="Next image"
                className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-subtle-dark p-3 text-white transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:bg-primary md:block"
              >
                <ArrowForward sx={{ fontSize: 20 }} />
              </button>
            </>
          )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
