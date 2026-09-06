"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { IdeaForm, type Idea } from "./IdeaForm"

async function fetchIdeas(): Promise<Idea[]> {
  const res = await fetch("/api/ideas")
  if (!res.ok) throw new Error()
  return res.json()
}

export default function IdeasPage() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: ideas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["ideas"],
    queryFn: fetchIdeas,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ideas"] }),
    onError: () => alert("Something went wrong deleting this idea. Please try again."),
  })

  function handleDelete(id: string) {
    if (!confirm("Delete this idea?")) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Ideas</h1>
          <p className="text-sm text-muted mt-0.5">{ideas.length} ideas captured total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          Add Idea
        </button>
      </div>

      {/* Add Idea modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-foreground text-base">New Idea</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground transition-colors text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
              <IdeaForm
                onSaved={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isError ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
            <p className="text-danger font-medium">Couldn&apos;t load ideas. This is a display error, not data loss.</p>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl">
            <p className="text-muted">Loading…</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl">
            <p className="text-muted">No ideas captured yet. Start brainstorming.</p>
          </div>
        ) : (
          ideas.map(idea => (
            <div key={idea.id} className="bg-white rounded-3xl p-5 flex flex-col justify-between shadow-md hover:shadow-md transition-shadow duration-200">
              <div>
                <p className="font-bold text-foreground leading-snug tracking-tight text-[15px] mb-2">{idea.title}</p>
                {idea.body && <p className="text-sm text-muted leading-relaxed line-clamp-4 mb-4">{idea.body}</p>}
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {idea.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-extrabold uppercase tracking-wider bg-surface text-muted px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-3.5 bg-surface -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                <Link href={`/ideas/${idea.id}`} className="text-xs font-semibold text-muted hover:text-foreground transition-colors">Edit</Link>
                <button
                  onClick={() => handleDelete(idea.id)}
                  disabled={deleteMutation.isPending && deleteMutation.variables === idea.id}
                  className="text-xs font-semibold text-danger hover:text-primary-hover transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending && deleteMutation.variables === idea.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
