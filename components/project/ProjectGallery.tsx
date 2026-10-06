"use client"

import { useState, type KeyboardEvent } from "react"
import { motion } from "motion/react"
import { ArrowBack, ArrowForward, Fullscreen } from "@mui/icons-material"
import { BrowserFrame } from "./BrowserFrame"
import { Lightbox } from "./Lightbox"

interface ProjectGalleryProps {
  images: string[]
  alt: string
  host?: string | null
}

const SWIPE_THRESHOLD = 64

export function ProjectGallery({ images, alt, host }: ProjectGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const count = images.length

  const go = (step: number) => setActive((i) => (i + step + count) % count)

  // Shortest signed distance from the active slide, so the deck wraps around
  const offsetOf = (i: number) => {
    let d = i - active
    if (d > count / 2) d -= count
    if (d < -count / 2) d += count
    return d
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(1)
    if (e.key === "ArrowLeft") go(-1)
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={`${alt} screens`} tabIndex={0} onKeyDown={onKeyDown} className="outline-none">
      <div className="relative mx-auto aspect-[4/3] w-[80%] md:aspect-[16/10] md:w-[52%]">
        {images.map((src, i) => {
          const d = offsetOf(i)
          const isActive = d === 0
          const visible = Math.abs(d) <= 1
          return (
            <motion.div
              key={src}
              aria-hidden={!isActive}
              initial={false}
              animate={{
                x: `${d * 62}%`,
                scale: isActive ? 1 : 0.8,
                opacity: visible ? 1 : 0,
                filter: isActive ? "grayscale(0)" : "grayscale(1)",
              }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: 10 - Math.abs(d), pointerEvents: visible ? "auto" : "none" }}
              drag={isActive && count > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD) go(1)
                if (info.offset.x > SWIPE_THRESHOLD) go(-1)
              }}
              onTap={() => (isActive ? setLightbox(i) : setActive(i))}
              className={`absolute inset-0 ${isActive ? "cursor-zoom-in" : "cursor-pointer"}`}
            >
              <BrowserFrame
                src={src}
                alt={`${alt}, screen ${i + 1}`}
                host={host}
                sizes="(max-width: 768px) 80vw, 52vw"
                pan={isActive}
                elevation={isActive ? "lifted" : "flat"}
              />
            </motion.div>
          )
        })}
      </div>

      <div className="mt-12 flex items-center justify-center gap-4">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous screen"
            className="rounded-full bg-white p-3 text-foreground shadow-md transition-colors hover:text-primary"
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </button>
        )}
        {count > 1 && (
          <span className="min-w-16 text-center text-sm tabular-nums text-muted" aria-live="polite">
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        )}
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next screen"
            className="rounded-full bg-white p-3 text-foreground shadow-md transition-colors hover:text-primary"
          >
            <ArrowForward sx={{ fontSize: 20 }} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setLightbox(active)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary"
        >
          <Fullscreen sx={{ fontSize: 18 }} /> Full size
        </button>
      </div>

      <Lightbox images={images} index={lightbox} alt={alt} onIndexChange={setLightbox} />
    </div>
  )
}
