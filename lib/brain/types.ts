import type { BrainSource } from "@/lib/db"

/** A normalized item pulled from any source, before enrichment/embedding. */
export interface RawDoc {
  /** Stable id in the origin system (Notion page id, Drive file id, content hash for local files) */
  externalId: string
  title: string
  /** "note" | "document" | "spreadsheet" | "pdf" | "presentation" | "text" | "other" */
  kind: string
  mimeType?: string
  /** Deep link back to the item in its origin app */
  sourceUrl?: string
  /** Breadcrumb in the origin system, e.g. "Work Notebook / Projects / Lenco" */
  path?: string
  /** Extracted plain-text / markdown content */
  content: string
  metadata?: Record<string, unknown>
  sourceModifiedAt?: Date
}

export interface ConnectorResult {
  docs: RawDoc[]
  /** externalIds deleted/archived in the source since the last sync */
  removedExternalIds: string[]
  /** Opaque incremental-sync state persisted on BrainSource.cursor */
  cursor: Record<string, unknown>
}

export interface Connector {
  provider: "notion" | "microsoft" | "google" | "local"
  displayName: string
  /** True if the connector can run inside a serverless function (no local fs) */
  cloudSafe: boolean
  sync(source: BrainSource): Promise<ConnectorResult>
}

/** Canonical categories the enrichment model files documents under. */
export const BRAIN_CATEGORIES = [
  "work",
  "projects",
  "finance",
  "career",
  "learning",
  "ideas",
  "personal",
  "health",
  "travel",
  "reference",
  "admin",
] as const
