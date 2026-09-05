import { eq } from "drizzle-orm"
import { db, brainSource, brainSyncRun, type BrainSource } from "@/lib/db"
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
  await db.insert(brainSource)
    .values({ provider: connector.provider, displayName: connector.displayName })
    .onConflictDoNothing({ target: brainSource.provider })
  const source = await db.query.brainSource.findFirst({
    where: (t, { eq }) => eq(t.provider, connector.provider),
  })
  return source!
}

/** Run one connector end-to-end: pull → ingest → prune → persist cursor + audit. */
export async function runSync(connector: Connector): Promise<SyncSummary> {
  assertAiConfigured()
  const source = await getOrCreateSource(connector)
  const [run] = await db.insert(brainSyncRun).values({ sourceId: source.id }).returning()

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

    await db.update(brainSource).set({
      cursor,
      status: "connected",
      lastSyncedAt: new Date(),
      lastError: null,
    }).where(eq(brainSource.id, source.id))
    await db.update(brainSyncRun).set({
      status: "success",
      added: summary.added,
      updated: summary.updated,
      removed: summary.removed,
      finishedAt: new Date(),
    }).where(eq(brainSyncRun.id, run.id))
    return summary
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.update(brainSource).set({ status: "error", lastError: message }).where(eq(brainSource.id, source.id))
    await db.update(brainSyncRun).set({ status: "error", error: message, finishedAt: new Date() }).where(eq(brainSyncRun.id, run.id))
    throw err
  }
}
