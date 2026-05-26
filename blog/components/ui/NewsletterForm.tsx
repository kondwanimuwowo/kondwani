"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check } from "@mui/icons-material"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState("loading")
    await new Promise((r) => setTimeout(r, 900))
    setState("done")
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {state !== "done" ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="flex items-center gap-0 bg-white/[0.05] border border-white/10 rounded-full pl-5 pr-1.5 py-1.5 focus-within:border-white/25 transition-colors duration-200"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="shrink-0 bg-primary text-white text-xs font-semibold px-5 py-2 rounded-full hover:bg-primary-hover transition-colors duration-200 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {state === "loading" ? (
                <>
                  <motion.span
                    className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                  Subscribing…
                </>
              ) : "SEND ME UPDATES"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-2.5 border border-white/10 rounded-full py-3 px-6"
          >
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Check sx={{ fontSize: 12 }} className="text-white" />
            </span>
            <span className="text-sm text-white/50">You&apos;re in. Talk soon.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
