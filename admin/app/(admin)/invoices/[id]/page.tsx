"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import { InvoiceForm, type Document } from "../InvoiceForm"

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/studio/invoices/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<Document>
      })
      .then(setDoc)
      .catch(() => setNotFound(true))
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Document</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {notFound ? (
          <p className="text-muted text-sm">Document not found.</p>
        ) : !doc ? (
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
