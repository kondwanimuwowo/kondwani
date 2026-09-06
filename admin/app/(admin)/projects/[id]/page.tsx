"use client"

import { useRouter, useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { ProjectForm, type Project } from "../ProjectForm"

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", params.id],
    queryFn: async (): Promise<Project> => {
      const res = await fetch(`/api/projects/${params.id}`)
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Project</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {isError ? (
          <p className="text-muted text-sm">Project not found.</p>
        ) : isLoading || !project ? (
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
