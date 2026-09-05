import { NextRequest, NextResponse } from "next/server"
import { isAuthorized } from "@/lib/brain/auth"
import { semanticSearch } from "@/lib/brain/search"

export const maxDuration = 60
export const dynamic = "force-dynamic"

/** Semantic search: GET /api/brain/search?q=...&limit=10&category=finance&provider=notion */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("q")
  if (!q) return NextResponse.json({ error: "missing ?q=" }, { status: 400 })

  const hits = await semanticSearch(q, {
    limit: Number(req.nextUrl.searchParams.get("limit")) || undefined,
    category: req.nextUrl.searchParams.get("category") ?? undefined,
    provider: req.nextUrl.searchParams.get("provider") ?? undefined,
  })

  return NextResponse.json({ query: q, hits })
}
