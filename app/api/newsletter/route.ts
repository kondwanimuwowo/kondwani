import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { Resend } from "resend"
import { db, newsletterSubscriber } from "@/lib/db"

const schema = z.object({ email: z.email() })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 })
    }

    const { email } = parsed.data

    await db.insert(newsletterSubscriber).values({ email }).onConflictDoNothing({ target: newsletterSubscriber.email })

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "portfolio@kondwanimuwowo.com",
      to: email,
      subject: "You're in — Kondwani Muwowo",
      text: `Hey,\n\nThanks for subscribing. I'll send occasional thoughts on design, code, and building things that matter.\n\nTalk soon,\nKondwani`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[newsletter]", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
