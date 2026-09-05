import { Prisma, type BrainSource } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { assertAiConfigured } from "./ai"
import { removeDocuments, upsertRawDoc, type UpsertedDoc } from "./pipeline"
import type { Connector } from "./types"

export interface SyncSummary {
  provider: string
  added: number
  updated: number
  unchanged: number
  removed: number
  /** documentId → category, for connectors that post-process (local vault filing) */
  results: UpsertedDoc[]
}

export async function getOrCreateSource(connector: Connector): Promise<BrainSource> {
  return prisma.brainSource.upsert({
    where: { provider: connector.provider },
    create: { provider: connector.provider, displayName: connector.displayName },
    update: {},
  })
}

/** Run one connector end-to-end: pull → ingest → prune → persist cursor + audit. */
export async function runSync(connector: Connector): Promise<SyncSummary> {
  assertAiConfigured()
  const source = await getOrCreateSource(connector)
  const run = await prisma.brainSyncRun.create({ data: { sourceId: source.id } })

  const summary: SyncSummary = {
    provider: connector.provider,
    added: 0,
    updated: 0,
    unchanged: 0,
    removed: 0,
    results: [],
  }

  try {
    const { docs, removedExternalIds, cursor } = await connector.sync(source)

    for (const doc of docs) {
      const result = await upsertRawDoc(source.id, doc)
      summary[result.outcome]++
      summary.results.push(result)
    }
    summary.removed = await removeDocuments(source.id, removedExternalIds)

    await prisma.brainSource.update({
      where: { id: source.id },
      data: {
        cursor: cursor as Prisma.InputJsonValue,
        status: "connected",
        lastSyncedAt: new Date(),
        lastError: null,
      },
    })
    await prisma.brainSyncRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        added: summary.added,
        updated: summary.updated,
        removed: summary.removed,
        finishedAt: new Date(),
      },
    })
    return summary
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.brainSource.update({
      where: { id: source.id },
      data: { status: "error", lastError: message },
    })
    await prisma.brainSyncRun.update({
      where: { id: run.id },
      data: { status: "error", error: message, finishedAt: new Date() },
    })
    throw err
  }
}
