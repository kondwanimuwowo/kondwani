"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowOutward } from "@mui/icons-material"
import { cn } from "@/lib/utils"

interface PillLinkProps {
  href: string
  children: React.ReactNode
  external?: boolean
  dark?: boolean
  className?: string
}

const MotionLink = motion.create(Link)

export function PillLink({ href, children, external, dark, className }: PillLinkProps) {
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {}

  return (
    <MotionLink
      href={href}
      whileHover="hover"
      className={cn(
        "inline-flex items-center gap-5 rounded-full border pl-7 pr-2 py-2 text-sm font-medium transition-colors duration-300 group",
        dark
          ? "border-white/20 text-white hover:border-primary"
          : "border-border text-foreground hover:border-primary hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
      <motion.span
        variants={{ hover: { rotate: 32 } }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300 shrink-0",
          dark ? "bg-white/15" : "bg-foreground"
        )}
      >
        <ArrowOutward sx={{ fontSize: 14 }} className="text-white" />
      </motion.span>
    </MotionLink>
  )
}
