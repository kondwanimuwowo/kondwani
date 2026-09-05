import type { BrainSource } from "@prisma/client"
import { extractFromBuffer, isSupportedFile } from "../extract"
import type { Connector, ConnectorResult, RawDoc } from "../types"

const DRIVE = "https://www.googleapis.com/drive/v3"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
export const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.readonly"
const MAX_FILE_BYTES = 15 * 1024 * 1024

/** Google-native formats we export to text; other files are downloaded raw. */
const EXPORTS: Record<string, { mime: string; ext: string; kind: string }> = {
  "application/vnd.google-apps.document": { mime: "text/plain", ext: "txt", kind: "document" },
  "application/vnd.google-apps.spreadsheet": { mime: "text/csv", ext: "csv", kind: "spreadsheet" },
  "application/vnd.google-apps.presentation": { mime: "text/plain", ext: "txt", kind: "presentation" },
}

interface GoogleCursor {
  pageToken?: string
}

interface GoogleCredentials {
  refreshToken?: string
}

/**
 * Google Drive via the Changes API: the stored pageToken means each sync only
 * sees files created/edited/trashed since the previous run. Google Docs,
 * Sheets, and Slides are exported to text; regular files (pdf/docx/xlsx/…)
 * are downloaded and parsed. Auth: `npm run brain:auth:google` once.
 */
export const googleConnector: Connector = {
  provider: "google",
  displayName: "Google Drive",
  cloudSafe: true,

  async sync(source: BrainSource): Promise<ConnectorResult> {
    const token = await getAccessToken(source)
    const cursor = (source.cursor ?? {}) as GoogleCursor

    const docs: RawDoc[] = []
    const removedExternalIds: string[] = []

    let pageToken = cursor.pageToken ?? (await getStartPageToken(token))
    // First-ever sync: the changes feed starts "now", so backfill with a full listing.
    if (!cursor.pageToken) await fullBackfill(token, docs)

    while (true) {
      const params = new URLSearchParams({
        pageToken,
        pageSize: "100",
        fields:
          "nextPageToken,newStartPageToken,changes(removed,fileId,file(id,name,mimeType,size,webViewLink,trashed,modifiedTime,parents))",
      })
      const page = await driveJson(token, `/changes?${params}`)

      for (const change of page.changes ?? []) {
        if (change.removed || change.file?.trashed) {
          removedExternalIds.push(`gdrive:${change.fileId}`)
          continue
        }
        if (change.file) await ingestFile(token, change.file, docs)
      }

      if (page.nextPageToken) {
        pageToken = page.nextPageToken
      } else {
        return { docs, removedExternalIds, cursor: { pageToken: page.newStartPageToken ?? pageToken } }
      }
    }
  },
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAccessToken(source: BrainSource): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — see BRAIN-SETUP.md")
  }
  const creds = (source.credentials ?? {}) as GoogleCredentials
  if (!creds.refreshToken) {
    throw new Error("Google account not connected — run `npm run brain:auth:google` once")
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`)
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function driveJson(token: string, path: string): Promise<any> {
  const res = await fetch(`${DRIVE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Drive ${path} failed (${res.status}): ${await res.text()}`)
  return res.json()
}

async function getStartPageToken(token: string): Promise<string> {
  const data = await driveJson(token, "/changes/startPageToken")
  return data.startPageToken
}

// ── Ingestion ─────────────────────────────────────────────────────────────────

async function fullBackfill(token: string, docs: RawDoc[]): Promise<void> {
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({
      pageSize: "100",
      q: "trashed = false",
      fields: "nextPageToken,files(id,name,mimeType,size,webViewLink,modifiedTime,parents)",
    })
    if (pageToken) params.set("pageToken", pageToken)
    const page = await driveJson(token, `/files?${params}`)
    for (const file of page.files ?? []) {
      await ingestFile(token, file, docs)
    }
    pageToken = page.nextPageToken
  } while (pageToken)
}

async function ingestFile(token: string, file: any, docs: RawDoc[]): Promise<void> {
  const exportSpec = EXPORTS[file.mimeType]
  const isNative = Boolean(exportSpec)
  if (!isNative && (!isSupportedFile(file.name ?? "") || Number(file.size ?? 0) > MAX_FILE_BYTES)) return

  try {
    const url = isNative
      ? `${DRIVE}/files/${file.id}/export?mimeType=${encodeURIComponent(exportSpec.mime)}`
      : `${DRIVE}/files/${file.id}?alt=media`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`download failed (${res.status})`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const filename = isNative ? `${file.name}.${exportSpec.ext}` : file.name
    const { content, kind } = await extractFromBuffer(buffer, filename)

    docs.push({
      externalId: `gdrive:${file.id}`,
      title: file.name,
      kind: isNative ? exportSpec.kind : kind,
      mimeType: file.mimeType,
      sourceUrl: file.webViewLink,
      path: "Google Drive",
      content,
      sourceModifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
      metadata: { size: file.size ? Number(file.size) : undefined },
    })
  } catch (err) {
    console.warn(`brain: skipping Drive file "${file.name}":`, err instanceof Error ? err.message : err)
  }
}
