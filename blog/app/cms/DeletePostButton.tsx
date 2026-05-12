"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return
    setLoading(true)
    await fetch(`/api/posts/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-40">
      Delete
    </button>
  )
}
