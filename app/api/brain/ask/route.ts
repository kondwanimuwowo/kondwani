import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"
import { ANSWER_MODEL } from "@/lib/brain/ai"
import { isAuthorized } from "@/lib/brain/auth"
import { semanticSearch } from "@/lib/brain/search"

export const maxDuration = 120
export const dynamic = "force-dynamic"

/**
 * RAG endpoint — ask the second brain a question:
 * POST /api/brain/ask { "question": "what did I budget for hosting in 2026?" }
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { question?: string } | null
  if (!body?.question) {
    return NextResponse.json({ error: "missing question" }, { status: 400 })
  }

  const hits = await semanticSearch(body.question, { limit: 12 })
  if (hits.length === 0) {
    return NextResponse.json({ answer: "The second brain has no indexed content yet.", sources: [] })
  }

  const context = hits
    .map((h, i) => `[${i + 1}] ${h.title}${h.path ? ` (${h.path})` : ""} — ${h.provider}\n${h.chunkText}`)
    .join("\n\n---\n\n")

  const { text } = await generateText({
    model: ANSWER_MODEL,
    system:
      "You answer questions using ONLY the provided excerpts from the user's personal second brain " +
      "(their notes, documents, and files). Cite sources inline as [1], [2]. " +
      "If the excerpts don't contain the answer, say so plainly instead of guessing.",
    prompt: `Question: ${body.question}\n\nExcerpts:\n\n${context}`,
  })

  return NextResponse.json({
    answer: text,
    sources: hits.map((h, i) => ({
      ref: i + 1,
      documentId: h.documentId,
      title: h.title,
      provider: h.provider,
      sourceUrl: h.sourceUrl,
      score: h.score,
    })),
  })
}
