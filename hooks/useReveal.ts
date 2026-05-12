"use client"
import { useRef, useState, useEffect, useLayoutEffect } from "react"

// useLayoutEffect on client (synchronous before paint), useEffect on server (no-op)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

export function useReveal(margin = "-80px") {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Already in view or above the viewport — reveal before first paint, no animation
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setRevealed(true)
      return
    }

    // Below fold — animate in when scrolled to
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          obs.disconnect()
        }
      },
      { rootMargin: margin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [margin])

  return { ref, revealed }
}
