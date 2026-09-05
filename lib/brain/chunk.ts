export interface Chunk {
  index: number
  text: string
  tokenCount: number
}

const TARGET_CHARS = 3200 // ~800 tokens
const OVERLAP_CHARS = 400 // ~100 tokens of context carried between chunks
const MIN_CHARS = 200 // merge tail fragments instead of embedding crumbs

/** Rough token estimate (≈4 chars/token for English/markdown). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Paragraph-aware chunker: packs paragraphs up to ~800 tokens, splitting
 * oversized paragraphs on sentence boundaries, with a small overlap so
 * context isn't lost at chunk edges.
 */
export function chunkText(raw: string): Chunk[] {
  const text = raw.replace(/\r\n/g, "\n").trim()
  if (!text) return []

  // Split into paragraphs, breaking up any single paragraph that exceeds the target
  const paragraphs = text
    .split(/\n{2,}/)
    .flatMap((p) => (p.length > TARGET_CHARS ? splitLong(p) : [p]))
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ""
  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > TARGET_CHARS) {
      chunks.push(current)
      current = current.slice(-OVERLAP_CHARS) + "\n\n" + para
    } else {
      current = current ? current + "\n\n" + para : para
    }
  }
  if (current) {
    if (chunks.length > 0 && current.length < MIN_CHARS) {
      chunks[chunks.length - 1] += "\n\n" + current
    } else {
      chunks.push(current)
    }
  }

  return chunks.map((text, index) => ({ index, text, tokenCount: estimateTokens(text) }))
}

function splitLong(paragraph: string): string[] {
  const sentences = paragraph.match(/[^.!?\n]+[.!?\n]*/g) ?? [paragraph]
  const parts: string[] = []
  let current = ""
  for (const s of sentences) {
    if (current && current.length + s.length > TARGET_CHARS) {
      parts.push(current)
      current = s
    } else {
      current += s
    }
  }
  if (current) parts.push(current)
  return parts
}
