"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { ClientForm, type Client } from "../ClientForm"

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/studio/clients/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json() as Promise<Client>
      })
      .then(setClient)
      .catch(() => setNotFound(true))
  }, [params.id])

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-muted hover:text-foreground transition-colors">
          <ArrowBack sx={{ fontSize: 20 }} />
        </Link>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Edit Client</h1>
      </div>

      <div className="bg-white shadow-md rounded-3xl p-6">
        {notFound ? (
          <p className="text-muted text-sm">Client not found.</p>
        ) : !client ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : (
          <ClientForm
            client={client}
            onSaved={() => router.push("/clients")}
            onCancel={() => router.push("/clients")}
            onDeleted={() => router.push("/clients")}
          />
        )}
      </div>
    </div>
  )
}
