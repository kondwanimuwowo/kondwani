"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Close } from "@mui/icons-material"
import { ProjectForm, type Project } from "./ProjectForm"

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) throw new Error()
  return res.json()
}

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: () => alert("Something went wrong deleting this project. Please try again."),
  })

  function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Projects</h1>
          <p className="text-sm text-muted mt-0.5">{projects.length} projects total</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors"
        >
          Add Project
        </button>
      </div>

      {/* Add Project modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-foreground text-base">New Project</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-foreground transition-colors">
                <Close sx={{ fontSize: 20 }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
              <ProjectForm
                onSaved={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isError ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl space-y-3">
            <p className="text-danger font-medium">Couldn&apos;t load projects. This is a display error, not data loss.</p>
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
        ) : projects.length === 0 ? (
          <div className="col-span-full bg-white px-6 py-16 text-center shadow-md rounded-3xl">
            <p className="text-muted">No projects yet.</p>
          </div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="bg-white overflow-hidden flex flex-col justify-between shadow-md hover:shadow-md transition-shadow duration-200 rounded-3xl">
              <div>
                {p.imageUrl ? (
                  <div className="relative h-40 bg-surface">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover animate-fade-in" sizes="400px" />
                  </div>
                ) : (
                  <div className="h-40 bg-surface flex items-center justify-center">
                    <span className="text-xs text-muted tracking-wider uppercase font-bold">No Cover Image</span>
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-foreground leading-snug tracking-tight text-[15px]">{p.title}</p>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      p.published
                        ? "bg-success-bg text-success"
                        : "bg-neutral-bg text-muted"
                    }`}>
                      {p.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  {p.slug && <p className="text-[10px] font-mono text-muted">/{p.slug}</p>}
                  <p className="text-sm text-muted line-clamp-2 leading-relaxed">{p.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.tech.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] font-medium bg-surface text-muted px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {p.tech.length > 4 && (
                      <span className="text-[10px] font-medium text-muted self-center pl-1">+{p.tech.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 bg-surface border-t border-border">
                <div className="flex items-center gap-3">
                  <Link href={`/projects/${p.id}`} className="text-xs font-semibold text-muted hover:text-foreground transition-colors">Edit</Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleteMutation.isPending && deleteMutation.variables === p.id}
                    className="text-xs font-semibold text-danger hover:text-danger transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending && deleteMutation.variables === p.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
                {p.liveUrl && (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    View site ↗
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
