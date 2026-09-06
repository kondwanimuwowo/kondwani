"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { ProjectForm, type Project } from "../ProjectForm"

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<Project>
      })
      .then(setProject)
      .catch(() => setNotFound(true))
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Project</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {notFound ? (
          <p className="text-muted text-sm">Project not found.</p>
        ) : !project ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <ProjectForm
            project={project}
            onSaved={() => router.push("/projects")}
            onCancel={() => router.push("/projects")}
            onDeleted={() => router.push("/projects")}
          />
        )}
      </div>
    </div>
  )
}
