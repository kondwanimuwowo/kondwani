"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { JobForm, type Job } from "../JobForm"

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<Job>
      })
      .then(setJob)
      .catch(() => setNotFound(true))
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/jobs" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Application</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {notFound ? (
          <p className="text-muted text-sm">Application not found.</p>
        ) : !job ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <JobForm
            job={job}
            onSaved={() => router.push("/jobs")}
            onCancel={() => router.push("/jobs")}
            onDeleted={() => router.push("/jobs")}
          />
        )}
      </div>
    </div>
  )
}
