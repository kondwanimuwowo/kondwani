"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ContentCopy } from "@mui/icons-material"
import { toast } from "@/lib/toast"
import { responseError } from "@/lib/http"

type Subscriber = { id: string; email: string; createdAt: string }

async function fetchSubscribers(): Promise<Subscriber[]> {
  const res = await fetch("/api/subscribers")
  if (!res.ok) throw new Error()
  return res.json()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

export default function SubscribersPage() {
  const queryClient = useQueryClient()
  const { data: subscribers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["subscribers"],
    queryFn: fetchSubscribers,
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" })
      if (!res.ok) throw await responseError(res, "Remove")
    },
    onSuccess: () => {
      toast.success("Subscriber removed")
      return queryClient.invalidateQueries({ queryKey: ["subscribers"] })
    },
    onError: e => toast.error(e.message),
  })

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(subscribers.map(s => s.email).join(", "))
      toast.success(`Copied ${subscribers.length} emails`)
    } catch {
      toast.error("Couldn't access the clipboard")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Subscribers</h1>
          <p className="text-sm text-muted mt-0.5">{subscribers.length} people signed up for the newsletter</p>
        </div>
        {subscribers.length > 0 && (
          <button onClick={copyEmails}
            className="flex items-center gap-2 text-sm font-semibold bg-white shadow-md text-foreground px-4 py-2 rounded-full hover:bg-neutral-bg transition-colors">
            <ContentCopy sx={{ fontSize: 16 }} /> Copy emails
          </button>
        )}
      </div>

      {isError ? (
        <div className="bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
          <p className="text-danger font-medium">Couldn&apos;t load subscribers.</p>
          <button onClick={() => refetch()}
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors">
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="bg-white px-6 py-16 text-center shadow-md rounded-3xl text-muted">Loading...</div>
      ) : subscribers.length === 0 ? (
        <div className="bg-white px-6 py-16 text-center shadow-md rounded-3xl text-muted">No subscribers yet.</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          {subscribers.map((s, i) => {
            const removing = removeMutation.isPending && removeMutation.variables === s.id
            return (
              <div key={s.id} className={`flex items-center gap-4 px-6 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <p className="text-sm font-medium text-foreground flex-1 truncate">{s.email}</p>
                <span className="text-xs text-muted shrink-0 hidden sm:inline">{formatDate(s.createdAt)}</span>
                <button
                  onClick={() => { if (confirm(`Remove ${s.email} from the newsletter?`)) removeMutation.mutate(s.id) }}
                  disabled={removing}
                  className="text-xs font-semibold text-danger transition-colors disabled:opacity-50 shrink-0">
                  {removing ? "Removing..." : "Remove"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
