import { embed, embedMany, generateObject } from "ai"
import { z } from "zod"
import { BRAIN_CATEGORIES } from "./types"

// All models are routed through the Vercel AI Gateway (AI_GATEWAY_API_KEY).
export const EMBEDDING_MODEL = "openai/text-embedding-3-small" // 1536 dims — must match vector(1536) in schema
export const ENRICH_MODEL = "anthropic/claude-haiku-4-5"
export const ANSWER_MODEL = "anthropic/claude-sonnet-5"

export function assertAiConfigured() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY is not set — embeddings and enrichment need the Vercel AI Gateway. See BRAIN-SETUP.md."
    )
  }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
    maxParallelCalls: 2,
  })
  return embeddings
}

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: EMBEDDING_MODEL, value: text })
  return embedding
}

const enrichmentSchema = z.object({
  summary: z.string().describe("2-3 sentence summary of what this document contains and why it matters"),
  tags: z.array(z.string()).max(6).describe("lowercase topical tags, e.g. 'invoicing', 'nextjs', 'budget-2026'"),
  category: z.enum(BRAIN_CATEGORIES).describe("the single best-fitting category"),
})

export type Enrichment = z.infer<typeof enrichmentSchema>

/** Ask Claude to summarize, tag, and categorize a document for filing. */
export async function enrichDocument(input: {
  title: string
  path?: string
  content: string
}): Promise<Enrichment | null> {
  try {
    const { object } = await generateObject({
      model: ENRICH_MODEL,
      schema: enrichmentSchema,
      prompt: [
        "You are the librarian of a personal second brain. File this document.",
        `Title: ${input.title}`,
        input.path ? `Location in source: ${input.path}` : "",
        "Content (may be truncated):",
        input.content.slice(0, 8000),
      ]
        .filter(Boolean)
        .join("\n\n"),
    })
    return object
  } catch (err) {
    // Enrichment is best-effort — a failed classification must never block ingestion.
    console.warn(`brain: enrichment failed for "${input.title}":`, err instanceof Error ? err.message : err)
    return null
  }
}
