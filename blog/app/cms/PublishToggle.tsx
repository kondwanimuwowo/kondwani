"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(published)

  async function toggle() {
    setLoading(true)
    const next = !current
    await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next, publishedAt: next ? new Date().toISOString() : null }),
    })
    setCurrent(next)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
        current
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-surface text-muted hover:bg-border"
      }`}>
      {loading ? "…" : current ? "Published" : "Draft"}
    </button>
  )
}
