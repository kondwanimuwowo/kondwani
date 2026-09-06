"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import { InvoiceForm } from "../InvoiceForm"

function NewInvoiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const newType = searchParams.get("new")
  const initialType = newType === "quote" ? "quote" : "invoice"
  const initialProjectId = searchParams.get("project") ?? undefined
  const initialClientId = searchParams.get("client") ?? undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">New Document</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        <InvoiceForm
          initialType={initialType}
          initialProjectId={initialProjectId}
          initialClientId={initialClientId}
          onSaved={() => router.push("/invoices")}
          onCancel={() => router.push("/invoices")}
        />
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense>
      <NewInvoiceContent />
    </Suspense>
  )
}
