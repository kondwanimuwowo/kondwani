"use client"

import { useRouter, useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { CaseStudyForm, type CaseStudy } from "../CaseStudyForm"

export default function EditCaseStudyPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const { data: study, isLoading, isError } = useQuery({
    queryKey: ["case-study", params.id],
    queryFn: async (): Promise<CaseStudy> => {
      const res = await fetch(`/api/case-studies/${params.id}`)
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/case-studies" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Case Study</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {isError ? (
          <p className="text-muted text-sm">Case study not found.</p>
        ) : isLoading || !study ? (
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
