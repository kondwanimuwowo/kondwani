"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { KeyboardArrowUp } from "@mui/icons-material"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-foreground text-white flex items-center justify-center shadow-lg hover:bg-primary transition-colors duration-200"
        >
          <KeyboardArrowUp fontSize="small" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
