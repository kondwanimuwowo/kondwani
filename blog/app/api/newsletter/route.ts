import { NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"
import { db, newsletterSubscriber } from "@/lib/db"

const schema = z.object({ email: z.email() })

// Same list as the portfolio's newsletter form
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 })
    const { email } = parsed.data

    await db.insert(newsletterSubscriber).values({ email }).onConflictDoNothing({ target: newsletterSubscriber.email })

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "portfolio@kondwanimuwowo.com",
        to: email,
        subject: "You're subscribed to Kondwani Muwowo's blog",
        text: "Hey,\n\nThanks for subscribing. I'll send new posts now and then.\n\nKondwani",
      }).catch((e) => console.error("[newsletter] welcome email failed", e))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[newsletter]", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
