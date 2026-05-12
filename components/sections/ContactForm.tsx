"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { motion } from "motion/react"
import { Email, LocationOn, Send, CheckCircle, Error as ErrorIcon } from "@mui/icons-material"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  company: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const inputClass =
  "w-full px-4 py-3 bg-white border border-border rounded-xl text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setStatus("loading")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setStatus("success")
      reset()
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
      {/* Info column */}
      <div className="lg:col-span-2 space-y-4">
        <a href="mailto:kondwanimuwowo@gmail.com" className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Email className="text-primary" fontSize="small" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">Email</p>
            <p className="text-sm text-muted group-hover:text-primary transition-colors">
              kondwanimuwowo@gmail.com
            </p>
          </div>
        </a>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <LocationOn className="text-primary" fontSize="small" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">Location</p>
            <p className="text-sm text-muted">Lusaka, Zambia</p>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="lg:col-span-3">
        {status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <CheckCircle className="text-primary" sx={{ fontSize: 32 }} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Message sent!</h3>
            <p className="text-muted mb-6">I&apos;ll get back to you as soon as possible.</p>
            <button
              onClick={() => setStatus("idle")}
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <input type="text" {...register("company")} className="hidden" tabIndex={-1} aria-hidden="true" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-primary">*</span>
                </label>
                <input id="name" type="text" {...register("name")} placeholder="Kondwani Muwowo" className={inputClass} />
                {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email <span className="text-primary">*</span>
                </label>
                <input id="email" type="email" {...register("email")} placeholder="you@example.com" className={inputClass} />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
              <input id="subject" type="text" {...register("subject")} placeholder="Project inquiry" className={inputClass} />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                Message <span className="text-primary">*</span>
              </label>
              <textarea
                id="message"
                rows={5}
                {...register("message")}
                placeholder="Tell me about your project..."
                className={`${inputClass} resize-none`}
              />
              {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message.message}</p>}
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <ErrorIcon fontSize="small" />
                Something went wrong. Please try again or email me directly.
              </div>
            )}

            <motion.button
              type="submit"
              disabled={status === "loading"}
              whileHover={{ scale: status === "loading" ? 1 : 1.02 }}
              whileTap={{ scale: status === "loading" ? 1 : 0.98 }}
              className="inline-flex items-center gap-2 bg-foreground text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send fontSize="small" />
              )}
              {status === "loading" ? "Sending…" : "Send Message"}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  )
}
