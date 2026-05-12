import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { path, referrer } = await request.json()
    if (!path || typeof path !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    await prisma.pageView.create({ data: { path, referrer: referrer ?? null } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
