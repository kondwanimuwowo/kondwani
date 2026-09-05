import { createHash } from "node:crypto"
import { and, eq, inArray } from "drizzle-orm"
import { db, brainChunk, brainDocument } from "@/lib/db"
import { embedTexts, enrichDocument } from "./ai"
import { chunkText } from "./chunk"
import type { RawDoc } from "./types"

export type UpsertOutcome = "added" | "updated" | "unchanged"

export interface UpsertedDoc {
  outcome: UpsertOutcome
  documentId: string
  externalId: string
  category: string | null
}

const MAX_CONTENT_CHARS = 400_000 // hard cap so one giant file can't blow up a sync

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex")
}

/**
 * Ingest one normalized document: skip if unchanged, otherwise enrich with
 * Claude (summary/tags/category), chunk, embed, and upsert doc + chunks.
 */
export async function upsertRawDoc(sourceId: string, raw: RawDoc): Promise<UpsertedDoc> {
  const content = raw.content.slice(0, MAX_CONTENT_CHARS).trim()
  const contentHash = hashContent(content)

  const existing = await db.query.brainDocument.findFirst({
    where: (t, { eq, and }) => and(eq(t.sourceId, sourceId), eq(t.externalId, raw.externalId)),
    columns: { id: true, contentHash: true, category: true },
  })

  if (existing && existing.contentHash === contentHash) {
    await db.update(brainDocument).set({
      syncedAt: new Date(),
      title: raw.title,
      sourceUrl: raw.sourceUrl,
      path: raw.path,
    }).where(eq(brainDocument.id, existing.id))
    return { outcome: "unchanged", documentId: existing.id, externalId: raw.externalId, category: existing.category }
  }

  if (!content) {
    // Nothing extractable — still record the document so it's browsable, but skip AI work.
    const doc = await saveDocument(sourceId, raw, "", contentHash, null)
    return { outcome: existing ? "updated" : "added", documentId: doc.id, externalId: raw.externalId, category: null }
  }

  const enrichment = await enrichDocument({ title: raw.title, path: raw.path, content })
  const chunks = chunkText(content)
  const embeddings = await embedTexts(chunks.map((c) => c.text))

  const doc = await saveDocument(sourceId, raw, content, contentHash, enrichment)

  // Replace chunks atomically.
  await db.transaction(async (tx) => {
    await tx.delete(brainChunk).where(eq(brainChunk.documentId, doc.id))
    for (let i = 0; i < chunks.length; i++) {
      await tx.insert(brainChunk).values({
        documentId: doc.id,
        index: chunks[i].index,
        text: chunks[i].text,
        tokenCount: chunks[i].tokenCount,
        embedding: embeddings[i],
      })
    }
  })

  return { outcome: existing ? "updated" : "added", documentId: doc.id, externalId: raw.externalId, category: doc.category }
}

async function saveDocument(
  sourceId: string,
  raw: RawDoc,
  content: string,
  contentHash: string,
  enrichment: { summary: string; tags: string[]; category: string } | null
) {
  const data = {
    title: raw.title,
    kind: raw.kind,
    mimeType: raw.mimeType,
    sourceUrl: raw.sourceUrl,
    path: raw.path,
    content,
    contentHash,
    metadata: raw.metadata ?? undefined,
    sourceModifiedAt: raw.sourceModifiedAt,
    syncedAt: new Date(),
    ...(enrichment
      ? { summary: enrichment.summary, tags: enrichment.tags, category: enrichment.category }
      : {}),
  }
  const [doc] = await db.insert(brainDocument)
    .values({ sourceId, externalId: raw.externalId, ...data })
    .onConflictDoUpdate({ target: [brainDocument.sourceId, brainDocument.externalId], set: data })
    .returning()
  return doc
}

export async function removeDocuments(sourceId: string, externalIds: string[]): Promise<number> {
  if (externalIds.length === 0) return 0
  const res = await db.delete(brainDocument)
    .where(and(eq(brainDocument.sourceId, sourceId), inArray(brainDocument.externalId, externalIds)))
    .returning({ id: brainDocument.id })
  return res.length
}
