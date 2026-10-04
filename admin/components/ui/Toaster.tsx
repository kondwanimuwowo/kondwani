"use client"

import { AnimatePresence, motion } from "motion/react"
import { CheckCircle, Error as ErrorIcon, Close } from "@mui/icons-material"
import { useToastStore } from "@/lib/toast"

export function Toaster() {
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col items-end gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            role={t.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto w-full sm:w-auto sm:max-w-sm bg-white shadow-lg rounded-3xl pl-4 pr-2 py-3 flex items-center gap-3"
          >
            {t.kind === "success" ? (
              <CheckCircle sx={{ fontSize: 20 }} className="text-success shrink-0" />
            ) : (
              <ErrorIcon sx={{ fontSize: 20 }} className="text-danger shrink-0" />
            )}
            <p className="text-sm font-medium text-foreground flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-foreground transition-colors shrink-0"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
