"use client"

import { useRef, useState, type KeyboardEvent } from "react"
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
// px/s; a quick flick changes screens even when the drag distance is short
const FLICK_VELOCITY = 110
// Springs carry velocity through an interrupted swipe instead of restarting
const SPRING = { type: "spring", duration: 0.55, bounce: 0.15 } as const

export function ProjectGallery({ images, alt, host }: ProjectGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  // The lightbox grows out of the active screen, wherever it is on the page
  const openLightbox = (i: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    setOrigin(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null)
    setLightbox(i)
  }
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
      {/* Fully opaque across the 800px content column, fading out through the gutters.
          The padding is deeper than the lifted shadow so the mask never clips it, and the
          wrapper ignores clicks so it doesn't cover the controls; the frames opt back in. */}
      <div className="pointer-events-none -my-32 py-32 md:[mask-image:linear-gradient(to_right,transparent,black_calc(50%_-_400px),black_calc(50%_+_400px),transparent)]">
        <div ref={stageRef} className="relative mx-auto aspect-[4/3] w-[80%] md:aspect-[16/10] md:w-[52%]">
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
                transition={SPRING}
                style={{ zIndex: 10 - Math.abs(d), pointerEvents: visible ? "auto" : "none" }}
                drag={isActive && count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  const flick = Math.abs(info.velocity.x) > FLICK_VELOCITY
                  if (info.offset.x < -SWIPE_THRESHOLD || (flick && info.velocity.x < 0)) go(1)
                  else if (info.offset.x > SWIPE_THRESHOLD || (flick && info.velocity.x > 0)) go(-1)
                }}
                onTap={() => (isActive ? openLightbox(i) : setActive(i))}
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
      </div>

      <div className="relative z-10 mt-12 flex items-center justify-center gap-4">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous screen"
            className="rounded-full bg-white p-3 text-foreground shadow-md transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:text-primary"
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
            className="rounded-full bg-white p-3 text-foreground shadow-md transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:text-primary"
          >
            <ArrowForward sx={{ fontSize: 20 }} />
          </button>
        )}
        <button
          type="button"
          onClick={() => openLightbox(active)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-white transition-[color,background-color,scale] duration-200 active:scale-[0.97] hover:bg-primary"
        >
          <Fullscreen sx={{ fontSize: 18 }} /> Full size
        </button>
      </div>

      <Lightbox images={images} index={lightbox} alt={alt} onIndexChange={setLightbox} origin={origin} />
    </div>
  )
}
