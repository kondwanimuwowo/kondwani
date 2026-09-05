import { NextRequest, NextResponse } from "next/server"
import { isAuthorized } from "@/lib/brain/auth"
import { connectors } from "@/lib/brain/connectors"
import { runSync } from "@/lib/brain/sync"

export const maxDuration = 300
export const dynamic = "force-dynamic"

/**
 * Sync one or all cloud sources. Triggered by Vercel Cron (every 6h) or
 * manually: GET /api/brain/sync?source=notion
 * The `local` connector is CLI-only (it reads the filesystem) and is skipped here.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const requested = req.nextUrl.searchParams.get("source")
  const targets = Object.values(connectors).filter(
    (c) => c.cloudSafe && (!requested || c.provider === requested)
  )
  if (targets.length === 0) {
    return NextResponse.json({ error: `unknown or non-cloud source: ${requested}` }, { status: 400 })
  }

  const results: Record<string, unknown> = {}
  for (const connector of targets) {
    try {
      const { results: _docs, ...summary } = await runSync(connector)
      results[connector.provider] = summary
    } catch (err) {
      results[connector.provider] = { error: err instanceof Error ? err.message : String(err) }
    }
  }

  return NextResponse.json({ ok: true, results })
}
