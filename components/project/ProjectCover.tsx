"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { BrowserFrame } from "./BrowserFrame"
import { Lightbox } from "./Lightbox"

interface ProjectCoverProps {
  images: string[]
  alt: string
  host?: string | null
}

export function ProjectCover({ images, alt, host }: ProjectCoverProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(0)}
        aria-label={`View ${alt} full size`}
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        className="block w-full cursor-zoom-in transition-[translate] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1"
      >
        <BrowserFrame
          src={images[0]}
          alt={alt}
          host={host}
          sizes="(max-width: 768px) 100vw, 768px"
          priority
          autoHeight
          reveal
          elevation="lifted"
        />
      </motion.button>
      <Lightbox images={images} index={open} alt={alt} onIndexChange={setOpen} />
    </>
  )
}
