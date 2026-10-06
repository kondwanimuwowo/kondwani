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
        className="block aspect-[4/3] w-full cursor-zoom-in md:aspect-[16/10]"
      >
        <BrowserFrame
          src={images[0]}
          alt={alt}
          host={host}
          sizes="(max-width: 896px) 100vw, 896px"
          priority
          pan
        />
      </motion.button>
      <Lightbox images={images} index={open} alt={alt} onIndexChange={setOpen} />
    </>
  )
}
