import type { NextRequest } from "next/server"

/**
 * Guard for the /api/brain/* routes. Accepts the CRON_SECRET as a bearer
 * token — Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` on its
 * own, and manual/CLI callers pass the same header.
 */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}
