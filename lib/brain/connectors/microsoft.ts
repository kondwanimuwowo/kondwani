import type { BrainSource } from "@/lib/db"
import { db, brainSource } from "@/lib/db"
import { eq } from "drizzle-orm"
import { extractFromBuffer, htmlToPlainText, isSupportedFile } from "../extract"
import type { Connector, ConnectorResult, RawDoc } from "../types"

const GRAPH = "https://graph.microsoft.com/v1.0"
const TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"
export const MS_SCOPES = "offline_access User.Read Notes.Read Files.Read"
const MAX_FILE_BYTES = 15 * 1024 * 1024

interface MsCursor {
  onenoteSince?: string
  driveDeltaLink?: string
}

interface MsCredentials {
  refreshToken?: string
}

/**
 * One connector for the whole Microsoft account: OneNote pages + OneDrive
 * files (which covers Excel workbooks — .xlsx files are parsed sheet-by-sheet).
 * Auth: one-time device-code flow (`npm run brain:auth:ms`), then silent
 * refresh-token renewal on every sync.
 */
export const microsoftConnector: Connector = {
  provider: "microsoft",
  displayName: "Microsoft (OneNote, OneDrive, Excel)",
  cloudSafe: true,

  async sync(source: BrainSource): Promise<ConnectorResult> {
    const accessToken = await getAccessToken(source)
    const cursor = (source.cursor ?? {}) as MsCursor

    const docs: RawDoc[] = []
    const removedExternalIds: string[] = []

    const onenoteSince = await syncOneNote(accessToken, cursor.onenoteSince, docs)
    const driveDeltaLink = await syncOneDrive(accessToken, cursor.driveDeltaLink, docs, removedExternalIds)

    return { docs, removedExternalIds, cursor: { onenoteSince, driveDeltaLink } }
  },
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAccessToken(source: BrainSource): Promise<string> {
  const clientId = process.env.MS_CLIENT_ID
  if (!clientId) throw new Error("MS_CLIENT_ID is not set — see BRAIN-SETUP.md")
  const creds = (source.credentials ?? {}) as MsCredentials
  if (!creds.refreshToken) {
    throw new Error("Microsoft account not connected — run `npm run brain:auth:ms` once")
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
      scope: MS_SCOPES,
    }),
  })
  if (!res.ok) throw new Error(`Microsoft token refresh failed (${res.status}): ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; refresh_token?: string }

  // Microsoft rotates refresh tokens — persist the new one immediately.
  if (data.refresh_token && data.refresh_token !== creds.refreshToken) {
    await db.update(brainSource).set({ credentials: { refreshToken: data.refresh_token } }).where(eq(brainSource.id, source.id))
  }
  return data.access_token
}

async function graphFetch(token: string, url: string): Promise<Response> {
  const res = await fetch(url.startsWith("http") ? url : `${GRAPH}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Graph ${url} failed (${res.status}): ${await res.text()}`)
  return res
}

// ── OneNote ───────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function syncOneNote(token: string, since: string | undefined, docs: RawDoc[]): Promise<string> {
  const newSince = new Date().toISOString()
  const filter = since ? `&$filter=lastModifiedDateTime gt ${since}` : ""
  let url: string | undefined =
    `/me/onenote/pages?$top=50&$orderby=lastModifiedDateTime desc` +
    `&$expand=parentSection($select=displayName),parentNotebook($select=displayName)${filter}`

  while (url) {
    const page: any = await (await graphFetch(token, url)).json()
    for (const item of page.value ?? []) {
      const html = await (await graphFetch(token, `/me/onenote/pages/${item.id}/content`)).text()
      docs.push({
        externalId: `onenote:${item.id}`,
        title: item.title || "Untitled page",
        kind: "note",
        mimeType: "text/html",
        sourceUrl: item.links?.oneNoteWebUrl?.href,
        path: [item.parentNotebook?.displayName, item.parentSection?.displayName]
          .filter(Boolean)
          .join(" / "),
        content: htmlToPlainText(html),
        sourceModifiedAt: item.lastModifiedDateTime ? new Date(item.lastModifiedDateTime) : undefined,
      })
    }
    url = page["@odata.nextLink"]
  }
  return newSince
}

// ── OneDrive (incl. Excel workbooks) ──────────────────────────────────────────

async function syncOneDrive(
  token: string,
  deltaLink: string | undefined,
  docs: RawDoc[],
  removedExternalIds: string[]
): Promise<string> {
  let url = deltaLink ?? `${GRAPH}/me/drive/root/delta?$top=100`

  while (true) {
    const page: any = await (await graphFetch(token, url)).json()

    for (const item of page.value ?? []) {
      const externalId = `onedrive:${item.id}`
      if (item.deleted) {
        removedExternalIds.push(externalId)
        continue
      }
      if (!item.file || !isSupportedFile(item.name) || (item.size ?? 0) > MAX_FILE_BYTES) continue

      try {
        const res = await graphFetch(token, `/me/drive/items/${item.id}/content`)
        const buffer = Buffer.from(await res.arrayBuffer())
        const { content, kind } = await extractFromBuffer(buffer, item.name)
        docs.push({
          externalId,
          title: item.name,
          kind,
          mimeType: item.file.mimeType,
          sourceUrl: item.webUrl,
          path: (item.parentReference?.path ?? "").replace("/drive/root:", "OneDrive") || "OneDrive",
          content,
          sourceModifiedAt: item.lastModifiedDateTime ? new Date(item.lastModifiedDateTime) : undefined,
          metadata: { size: item.size },
        })
      } catch (err) {
        console.warn(`brain: skipping OneDrive file "${item.name}":`, err instanceof Error ? err.message : err)
      }
    }

    if (page["@odata.nextLink"]) {
      url = page["@odata.nextLink"]
    } else {
      return page["@odata.deltaLink"] as string
    }
  }
}
