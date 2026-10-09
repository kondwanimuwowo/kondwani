"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useLenis } from "lenis/react"
import { ArrowBack, ArrowForward, Close } from "@mui/icons-material"

// Where an image sits on the page: its full box, the part of it actually showing, and its natural size
export interface SourceBox {
  image: DOMRect
  visible: DOMRect
  naturalWidth: number
  naturalHeight: number
}

export function measureSource(img: HTMLImageElement | null | undefined, clip?: Element | null): SourceBox | null {
  if (!img || !img.naturalWidth) return null
  const image = img.getBoundingClientRect()
  const box = clip?.getBoundingClientRect() ?? image
  const visible = new DOMRect(
    Math.max(image.left, box.left),
    Math.max(image.top, box.top),
    Math.min(image.right, box.right) - Math.max(image.left, box.left),
    Math.min(image.bottom, box.bottom) - Math.max(image.top, box.top),
  )
  return { image, visible, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
}

interface LightboxProps {
  images: string[]
  index: number | null
  alt: string
  onIndexChange: (index: number | null) => void
  // Measures the on-page image for an index, so the lightbox can grow out of it and contract back into it
  getSource?: (index: number) => SourceBox | null
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const MORPH_EASING = "cubic-bezier(0.32, 0.72, 0, 1)"
const OPEN_MS = 450
const CLOSE_MS = 350
const RADIUS = 24

// Transform and clip that make the full-size image sit exactly where the on-page image is
function flipFrom(el: HTMLElement, src: SourceBox) {
  const target = el.getBoundingClientRect()
  const scale = src.image.width / target.width
  const clipTop = (src.visible.top - src.image.top) / scale
  const clipBottom = Math.max(0, target.height - (src.visible.bottom - src.image.top) / scale)
  return {
    transform: `translate(${src.image.left - target.left}px, ${src.image.top - target.top}px) scale(${scale})`,
    clipPath: `inset(${clipTop}px 0px ${clipBottom}px 0px round ${RADIUS / scale}px)`,
  }
}

const SETTLED = { transform: "none", clipPath: `inset(0px 0px 0px 0px round ${RADIUS}px)` }

export function Lightbox({ images, index, alt, onIndexChange, getSource }: LightboxProps) {
  const lenis = useLenis()
  const reduceMotion = useReducedMotion()
  const open = index !== null
  const count = images.length
  const imageRef = useRef<HTMLDivElement>(null)
  const openedIndex = useRef<number | null>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    document.documentElement.style.overflow = "hidden"
    return () => {
      lenis?.start()
      document.documentElement.style.overflow = ""
    }
  }, [open, lenis])

  // First frame after opening: grow out of the on-page image. Browsing to another image: a quick fade.
  useLayoutEffect(() => {
    if (index === null) {
      openedIndex.current = null
      return
    }
    const el = imageRef.current
    if (!el || reduceMotion) {
      openedIndex.current ??= index
      return
    }
    if (openedIndex.current === null) {
      openedIndex.current = index
      const src = getSource?.(index)
      if (!src) return
      // Give the full-size image the right proportions before it loads, so the morph lands on its real shape
      el.style.aspectRatio = `${src.naturalWidth} / ${src.naturalHeight}`
      el.animate([flipFrom(el, src), SETTLED], { duration: OPEN_MS, easing: MORPH_EASING })
      return
    }
    el.animate(
      [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
      { duration: 350, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    )
  }, [index, getSource, reduceMotion])

  const close = useCallback(() => {
    if (closing || index === null) return
    const src = getSource?.(index)
    const el = imageRef.current
    if (!src || !el || reduceMotion) {
      onIndexChange(null)
      return
    }
    setClosing(true)
    const animation = el.animate([SETTLED, flipFrom(el, src)], { duration: CLOSE_MS, easing: MORPH_EASING, fill: "forwards" })
    animation.onfinish = () => {
      setClosing(false)
      onIndexChange(null)
    }
  }, [closing, index, getSource, reduceMotion, onIndexChange])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowRight") onIndexChange((index + 1) % count)
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + count) % count)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, count, onIndexChange, close])

  const chromeVisible = { opacity: closing ? 0 : 1, transition: { duration: closing ? 0.2 : 0.3, ease: EASE_OUT } }

  return (
    <AnimatePresence>
      {index !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt}, image ${index + 1} of ${count}`}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          className="fixed inset-0 z-[60] flex flex-col"
        >
          <motion.div initial={{ opacity: 0 }} animate={chromeVisible} className="absolute inset-0 bg-foreground" />

          <motion.div initial={{ opacity: 0 }} animate={chromeVisible} className="relative flex shrink-0 items-center justify-between px-4 py-4 md:px-8">
            <span className="text-sm tabular-nums text-muted-dark">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-full bg-subtle-dark p-2 text-white transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:bg-primary"
            >
              <Close sx={{ fontSize: 20 }} />
            </button>
          </motion.div>

          <div key={index} data-lenis-prevent className="relative flex-1 overflow-y-auto px-4 pb-8 md:px-24">
            <div ref={imageRef} style={{ transformOrigin: "0 0" }} className="mx-auto max-w-6xl overflow-hidden rounded-3xl">
              <Image
                src={images[index]}
                alt={`${alt}, image ${index + 1}`}
                width={1920}
                height={1080}
                sizes="(max-width: 1280px) 100vw, 1152px"
                className="h-auto w-full"
              />
            </div>
          </div>

          {count > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={chromeVisible}>
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
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
