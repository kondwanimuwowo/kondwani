"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { CaseStudyForm, type CaseStudy } from "../CaseStudyForm"

export default function EditCaseStudyPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [study, setStudy] = useState<CaseStudy | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/case-studies/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<CaseStudy>
      })
      .then(setStudy)
      .catch(() => setNotFound(true))
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/case-studies" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Case Study</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {notFound ? (
          <p className="text-muted text-sm">Case study not found.</p>
        ) : !study ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <CaseStudyForm
            caseStudy={study}
            onSaved={() => router.push("/case-studies")}
            onCancel={() => router.push("/case-studies")}
            onDeleted={() => router.push("/case-studies")}
          />
        )}
      </div>
    </div>
  )
}
