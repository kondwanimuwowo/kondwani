"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { CloudUpload, Close } from "@mui/icons-material"

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = "Cover image" }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError("")
    setUploading(true)
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`)
      if (!res.ok) throw new Error("Failed to get upload URL")
      const { url, publicUrl } = await res.json()
      const put = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
      if (!put.ok) throw new Error("Upload failed")
      onChange(publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">{label}</p>
      {value ? (
        <div className="relative rounded-2xl overflow-hidden shadow-sm group w-full h-48">
          <Image src={value} alt="Upload preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
          >
            <Close sx={{ fontSize: 14 }} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-36 rounded-2xl bg-surface flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-colors disabled:opacity-60 cursor-pointer"
        >
          {uploading ? (
            <span className="w-5 h-5 rounded-full border-2 border-primary-tint border-t-primary animate-spin" />
          ) : (
            <>
              <CloudUpload sx={{ fontSize: 28 }} />
              <span className="text-xs font-medium">Click to upload</span>
            </>
          )}
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
