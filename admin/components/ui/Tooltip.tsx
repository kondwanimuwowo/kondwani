"use client"

import { useState, useRef } from "react"

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show() {
    timer.current = setTimeout(() => setVisible(true), 300)
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }

  const posClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side]

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span className={`pointer-events-none absolute z-50 ${posClass} whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg`}>
          {content}
        </span>
      )}
    </span>
  )
}
