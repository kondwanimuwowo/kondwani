"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { CloudUpload, Delete } from "@mui/icons-material"

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploader({ value, onChange, label = "Image" }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max file size is 5 MB.")
      return
    }
    setUploading(true)
    setError("")
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!res.ok) throw new Error("Failed to get upload URL")
      const { uploadUrl, publicUrl } = await res.json()
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
      onChange(publicUrl)
    } catch {
      setError("Upload failed. Try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden shadow-sm group w-full h-40">
          <Image src={value} alt="Uploaded" fill className="object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-white text-danger rounded-full p-1.5 shadow-sm"
              title="Remove"
            >
              <Delete fontSize="small" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className="w-full h-40 bg-surface rounded-2xl flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="w-6 h-6 border-2 border-primary-tint border-t-primary rounded-full animate-spin" />
          ) : (
            <>
              <CloudUpload />
              <span className="text-sm font-medium">Click or drag to upload</span>
              <span className="text-xs">PNG, JPG, WebP up to 5 MB</span>
            </>
          )}
        </button>
      )}

      {/* URL input as fallback */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste an image URL"
        className="mt-2 w-full bg-surface rounded-2xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-tint"
      />

      {error && <p className="text-xs text-danger mt-1">{error}</p>}

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
