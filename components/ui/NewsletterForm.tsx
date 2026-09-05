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
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setState("done")
    } catch {
      setState("idle")
    }
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
            className="flex items-center gap-0 bg-subtle-dark rounded-full pl-5 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-muted-dark transition-colors duration-200"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-dark outline-none min-w-0"
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
            className="flex items-center justify-center gap-2.5 bg-subtle-dark rounded-full py-3 px-6"
          >
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Check sx={{ fontSize: 12 }} className="text-white" />
            </span>
            <span className="text-sm text-muted-dark">You&apos;re in. Talk soon.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
