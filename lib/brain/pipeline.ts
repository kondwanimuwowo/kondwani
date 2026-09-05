import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
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

  const existing = await prisma.brainDocument.findUnique({
    where: { sourceId_externalId: { sourceId, externalId: raw.externalId } },
    select: { id: true, contentHash: true, category: true },
  })

  if (existing && existing.contentHash === contentHash) {
    await prisma.brainDocument.update({
      where: { id: existing.id },
      data: { syncedAt: new Date(), title: raw.title, sourceUrl: raw.sourceUrl, path: raw.path },
    })
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

  // Replace chunks atomically; embeddings need raw SQL because Prisma can't
  // write Unsupported("vector") columns.
  await prisma.$transaction(async (tx) => {
    await tx.brainChunk.deleteMany({ where: { documentId: doc.id } })
    for (let i = 0; i < chunks.length; i++) {
      await tx.$executeRaw`
        INSERT INTO "BrainChunk" ("id", "documentId", "index", "text", "tokenCount", "embedding")
        VALUES (${cuidLike()}, ${doc.id}, ${chunks[i].index}, ${chunks[i].text}, ${chunks[i].tokenCount},
                ${JSON.stringify(embeddings[i])}::vector)`
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
    metadata: (raw.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    sourceModifiedAt: raw.sourceModifiedAt,
    syncedAt: new Date(),
    ...(enrichment
      ? { summary: enrichment.summary, tags: enrichment.tags, category: enrichment.category }
      : {}),
  }
  return prisma.brainDocument.upsert({
    where: { sourceId_externalId: { sourceId, externalId: raw.externalId } },
    create: { sourceId, externalId: raw.externalId, ...data },
    update: data,
  })
}

export async function removeDocuments(sourceId: string, externalIds: string[]): Promise<number> {
  if (externalIds.length === 0) return 0
  const res = await prisma.brainDocument.deleteMany({
    where: { sourceId, externalId: { in: externalIds } },
  })
  return res.count
}

/** Prisma's cuid() default doesn't apply on raw inserts — generate a compatible id. */
function cuidLike(): string {
  return "c" + createHash("sha1").update(`${Date.now()}${Math.random()}`).digest("hex").slice(0, 23)
}
