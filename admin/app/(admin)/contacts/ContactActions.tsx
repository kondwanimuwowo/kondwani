"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch, errorText } from "@/lib/http"
import { toast } from "@/lib/toast"

export function ContactActions({ id, read, name }: { id: string; read: boolean; name: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<"read" | "delete" | null>(null)

  async function act(kind: "read" | "delete") {
    if (kind === "delete" && !confirm(`Delete the message from ${name}?`)) return
    setPending(kind)
    try {
      await apiFetch(`/api/contacts/${id}`, { method: kind === "read" ? "PATCH" : "DELETE", action: kind === "read" ? "Update" : "Delete" })
      if (kind === "delete") toast.success("Message deleted")
      router.refresh()
    } catch (e) {
      toast.error(errorText(e))
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {!read && (
        <button onClick={() => act("read")} disabled={pending !== null}
          className="text-xs font-semibold text-muted hover:text-foreground transition-colors disabled:opacity-50">
          {pending === "read" ? "Marking..." : "Mark read"}
        </button>
      )}
      <button onClick={() => act("delete")} disabled={pending !== null}
        className="text-xs font-semibold text-danger transition-colors disabled:opacity-50">
        {pending === "delete" ? "Deleting..." : "Delete"}
      </button>
    </div>
  )
}
