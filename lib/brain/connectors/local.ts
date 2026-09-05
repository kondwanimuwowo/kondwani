import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import type { BrainSource } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { extractFromBuffer, isSupportedFile } from "../extract"
import type { Connector, ConnectorResult, RawDoc } from "../types"
import type { SyncSummary } from "../sync"

export const INBOX_DIR = path.join(process.cwd(), "brain-inbox")
export const VAULT_DIR = path.join(process.cwd(), "brain-vault")

/**
 * Local drop folder. Put any file in `brain-inbox/` and run
 * `npm run brain:sync -- local` — the file is ingested, AI-categorized, and
 * moved to `brain-vault/<category>/`. externalId is the content hash, so the
 * same file dropped twice is a no-op. CLI-only (needs the filesystem).
 */
export const localConnector: Connector = {
  provider: "local",
  displayName: "Local inbox",
  cloudSafe: false,

  async sync(_source: BrainSource): Promise<ConnectorResult> {
    await fs.mkdir(INBOX_DIR, { recursive: true })
    const entries = await fs.readdir(INBOX_DIR, { withFileTypes: true })

    const docs: RawDoc[] = []
    for (const entry of entries) {
      if (!entry.isFile() || entry.name.startsWith(".")) continue
      const filePath = path.join(INBOX_DIR, entry.name)
      if (!isSupportedFile(entry.name)) {
        console.warn(`brain: unsupported file left in inbox: ${entry.name}`)
        continue
      }
      try {
        const buffer = await fs.readFile(filePath)
        const stat = await fs.stat(filePath)
        const { content, kind } = await extractFromBuffer(buffer, entry.name)
        docs.push({
          externalId: `local:${createHash("sha256").update(buffer).digest("hex")}`,
          title: entry.name,
          kind,
          sourceUrl: undefined,
          path: "brain-inbox",
          content,
          sourceModifiedAt: stat.mtime,
          metadata: { filename: entry.name, inboxPath: filePath, size: stat.size },
        })
      } catch (err) {
        console.warn(`brain: failed to read inbox file "${entry.name}":`, err instanceof Error ? err.message : err)
      }
    }

    // Local files have no remote source of truth to detect deletions from —
    // the vault (and the DB) IS the source of truth once ingested.
    return { docs, removedExternalIds: [], cursor: { lastScanAt: new Date().toISOString() } }
  },
}

/**
 * After a local sync, file each ingested inbox document into
 * `brain-vault/<category>/` and update its recorded path.
 */
export async function organizeInbox(summary: SyncSummary): Promise<string[]> {
  const moved: string[] = []
  for (const result of summary.results) {
    const doc = await prisma.brainDocument.findUnique({
      where: { id: result.documentId },
      select: { id: true, category: true, metadata: true },
    })
    const meta = (doc?.metadata ?? {}) as { filename?: string; inboxPath?: string; size?: number }
    if (!doc || !meta.inboxPath) continue

    const category = doc.category ?? "reference"
    const targetDir = path.join(VAULT_DIR, category)
    await fs.mkdir(targetDir, { recursive: true })
    const target = await uniquePath(path.join(targetDir, meta.filename ?? path.basename(meta.inboxPath)))

    try {
      await fs.rename(meta.inboxPath, target)
    } catch {
      continue // already moved on a previous run, or file was removed by hand
    }

    const relative = path.relative(process.cwd(), target).split(path.sep).join("/")
    await prisma.brainDocument.update({
      where: { id: doc.id },
      data: {
        path: relative,
        metadata: { ...meta, inboxPath: undefined, vaultPath: relative },
      },
    })
    moved.push(`${meta.filename} → ${relative}`)
  }
  return moved
}

async function uniquePath(target: string): Promise<string> {
  const { dir, name, ext } = path.parse(target)
  let candidate = target
  for (let i = 2; ; i++) {
    try {
      await fs.access(candidate)
      candidate = path.join(dir, `${name}-${i}${ext}`)
    } catch {
      return candidate
    }
  }
}
