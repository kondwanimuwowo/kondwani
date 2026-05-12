"use client"

import { useRouter } from "next/navigation"

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter()

  async function markRead() {
    await fetch(`/api/contacts/${id}`, { method: "PATCH" })
    router.refresh()
  }

  return (
    <button onClick={markRead} className="text-xs font-medium text-muted hover:text-foreground transition-colors">
      Mark read
    </button>
  )
}
