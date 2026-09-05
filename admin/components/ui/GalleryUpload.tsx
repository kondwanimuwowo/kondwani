"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { AddPhotoAlternate, Close } from "@mui/icons-material"

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
}

export function GalleryUpload({ value, onChange }: Props) {
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
      onChange([...value, publicUrl])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Gallery</p>
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, i) => (
          <div key={i} className="relative rounded-2xl overflow-hidden shadow-sm group aspect-video">
            <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
            >
              <Close sx={{ fontSize: 12 }} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-video rounded-2xl bg-surface flex flex-col items-center justify-center gap-1 text-muted hover:text-primary transition-colors disabled:opacity-60 cursor-pointer"
        >
          {uploading ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary-tint border-t-primary animate-spin" />
          ) : (
            <>
              <AddPhotoAlternate sx={{ fontSize: 20 }} />
              <span className="text-[10px] font-medium">Add</span>
            </>
          )}
        </button>
      </div>
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
