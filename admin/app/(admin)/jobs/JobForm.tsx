"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export type Job = {
  id: string
  company: string
  role: string
  status: string
  appliedAt: string
  notes?: string | null
  url?: string | null
}

const STATUSES = ["applied", "interview", "offer", "rejected", "withdrawn"]

const empty = { company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], notes: "", url: "" }

function toFormState(job?: Job) {
  if (!job) return empty
  return { company: job.company, role: job.role, status: job.status, appliedAt: job.appliedAt.split("T")[0], notes: job.notes ?? "", url: job.url ?? "" }
}

interface Props {
  job?: Job
  onSaved: () => void
  onCancel: () => void
  onDeleted?: () => void
}

export function JobForm({ job, onSaved, onCancel, onDeleted }: Props) {
  const [form, setForm] = useState(toFormState(job))
  const editId = job?.id
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editId ? "PUT" : "POST"
      const url = editId ? `/api/jobs/${editId}` : "/api/jobs"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, appliedAt: new Date(form.appliedAt).toISOString() }),
      })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      if (editId) queryClient.invalidateQueries({ queryKey: ["job", editId] })
      onSaved()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${editId}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`Delete failed (${res.status})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      onDeleted?.()
    },
  })

  function handleDelete() {
    if (!editId) return
    if (!confirm("Delete this application?")) return
    deleteMutation.mutate()
  }

  const saving = saveMutation.isPending
  const deleting = deleteMutation.isPending
  const error = saveMutation.isError
    ? "Something went wrong saving this application. Please try again."
    : deleteMutation.isError
    ? "Something went wrong deleting this application. Please try again."
    : null

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-danger-bg text-danger text-sm font-medium px-4 py-3 rounded-3xl">{error}</div>
      )}
      {(["company", "role", "url"] as const).map(field => (
        <div key={field}>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1 capitalize">
            {field === "url" ? "Listing URL" : field}
          </label>
          <input
            value={form[field]}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            placeholder={field === "url" ? "https://" : ""}
            className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all font-sans"
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all capitalize"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Applied date</label>
          <input
            type="date"
            value={form.appliedAt}
            onChange={e => setForm(f => ({ ...f, appliedAt: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 bg-surface border border-border rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-tint transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {editId && (
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="text-sm font-semibold text-danger hover:text-danger transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onCancel}
          disabled={saving || deleting}
          className="bg-white shadow-md px-5 py-2 rounded-full text-sm font-semibold text-foreground hover:bg-neutral-bg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saving || deleting}
          className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Application"}
        </button>
      </div>
    </div>
  )
}
