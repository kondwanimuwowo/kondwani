import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename") ?? "upload"
  const type = searchParams.get("type") ?? "image/jpeg"

  const ext = filename.split(".").pop() ?? "jpg"
  const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: type }),
    { expiresIn: 300 }
  )

  return NextResponse.json({ url, publicUrl: `${R2_PUBLIC_URL}/${key}` })
}
