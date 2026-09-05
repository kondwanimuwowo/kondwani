import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { embedQuery } from "./ai"

export interface SearchHit {
  documentId: string
  title: string
  provider: string
  sourceUrl: string | null
  path: string | null
  category: string | null
  tags: string[]
  chunkText: string
  score: number
}

/** Semantic search over all chunks using pgvector cosine similarity. */
export async function semanticSearch(
  query: string,
  opts: { limit?: number; category?: string; provider?: string } = {}
): Promise<SearchHit[]> {
  const limit = Math.min(opts.limit ?? 10, 50)
  const vector = JSON.stringify(await embedQuery(query))
  const category = opts.category ?? null
  const provider = opts.provider ?? null

  const result = await db.execute<Omit<SearchHit, "score"> & { score: number }>(sql`
    SELECT
      d."id"        AS "documentId",
      d."title",
      s."provider",
      d."sourceUrl",
      d."path",
      d."category",
      d."tags",
      c."text"      AS "chunkText",
      1 - (c."embedding" <=> ${vector}::vector) AS "score"
    FROM "BrainChunk" c
    JOIN "BrainDocument" d ON d."id" = c."documentId"
    JOIN "BrainSource"  s ON s."id" = d."sourceId"
    WHERE c."embedding" IS NOT NULL
      AND (${category}::text IS NULL OR d."category" = ${category})
      AND (${provider}::text IS NULL OR s."provider" = ${provider})
    ORDER BY c."embedding" <=> ${vector}::vector
    LIMIT ${limit}
  `)

  return result.rows
}
