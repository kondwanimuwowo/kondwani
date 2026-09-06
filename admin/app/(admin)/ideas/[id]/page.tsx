"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { IdeaForm, type Idea } from "../IdeaForm"

export default function EditIdeaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/ideas/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<Idea>
      })
      .then(setIdea)
      .catch(() => setNotFound(true))
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ideas" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Idea</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {notFound ? (
          <p className="text-muted text-sm">Idea not found.</p>
        ) : !idea ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <IdeaForm
            idea={idea}
            onSaved={() => router.push("/ideas")}
            onCancel={() => router.push("/ideas")}
            onDeleted={() => router.push("/ideas")}
          />
        )}
      </div>
    </div>
  )
}
