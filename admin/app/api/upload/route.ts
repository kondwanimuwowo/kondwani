import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { r2, getR2Bucket, getR2PublicUrl } from "@/lib/r2"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { UPLOAD_FOLDERS, isUploadFolder } from "@/lib/upload"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename") ?? "upload"
  const type = searchParams.get("type") || "image/jpeg"
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 })
  }

  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "jpg"
  const folder = searchParams.get("folder")
  if (!isUploadFolder(folder)) {
    return NextResponse.json({ error: "Unknown upload folder" }, { status: 400 })
  }
  const key = `${UPLOAD_FOLDERS[folder]}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: getR2Bucket(), Key: key, ContentType: type }),
      { expiresIn: 300 }
    )
    return NextResponse.json({ url, publicUrl: `${getR2PublicUrl()}/${key}` })
  } catch (e) {
    console.error("Failed to sign upload URL", e)
    return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 })
  }
}
