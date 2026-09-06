"use client"

import { useRouter, useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import { InvoiceForm, type Document } from "../InvoiceForm"

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ["invoice", params.id],
    queryFn: async (): Promise<Document> => {
      const res = await fetch(`/api/studio/invoices/${params.id}`)
      if (!res.ok) throw new Error()
      return res.json()
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Document</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {isError ? (
          <p className="text-muted text-sm">Document not found.</p>
        ) : isLoading || !doc ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <InvoiceForm
            document={doc}
            onSaved={() => router.push("/invoices")}
            onCancel={() => router.push("/invoices")}
            onDeleted={() => router.push("/invoices")}
          />
        )}
      </div>
    </div>
  )
}
