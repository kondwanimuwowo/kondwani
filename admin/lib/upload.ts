export const UPLOAD_FOLDERS = {
  "project-cover": "projects/covers",
  "project-gallery": "projects/gallery",
  "case-study-cover": "case-studies/covers",
  "case-study-gallery": "case-studies/gallery",
} as const

export type UploadFolder = keyof typeof UPLOAD_FOLDERS

export function isUploadFolder(value: string | null): value is UploadFolder {
  return value !== null && value in UPLOAD_FOLDERS
}

async function errorMessage(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as { error?: string }
    if (data?.error) return `${data.error} (${res.status})`
  } catch {}
  return `${fallback} (${res.status})`
}

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const params = new URLSearchParams({ filename: file.name, type: file.type, folder })
  const res = await fetch(`/api/upload?${params}`)
  if (!res.ok) throw new Error(await errorMessage(res, "Could not get upload URL"))
  const { url, publicUrl } = (await res.json()) as { url: string; publicUrl: string }

  let put: Response
  try {
    put = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
  } catch {
    throw new Error("Storage rejected the request. Check the bucket's CORS origins.")
  }
  if (!put.ok) throw new Error(`Storage rejected the upload (${put.status})`)
  return publicUrl
}

export async function responseError(res: Response, action: string) {
  return new Error(await errorMessage(res, `${action} failed`))
}
