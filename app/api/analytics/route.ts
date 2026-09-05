import { NextResponse } from "next/server"
import { db, pageView } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { path, referrer } = await request.json()
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    await db.insert(pageView).values({ path, referrer: referrer ?? null })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("analytics route error:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
