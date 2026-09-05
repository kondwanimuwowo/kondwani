import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { Resend } from "resend"
import { db, contactSubmission } from "@/lib/db"

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  subject: z.string().optional(),
  message: z.string().min(10),
  company: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid fields" }, { status: 400 })
    }

    const { name, email, subject, message, company } = parsed.data

    // Honeypot: silently succeed for bots
    if (company) {
      return NextResponse.json({ ok: true })
    }

    // Save to database
    await db.insert(contactSubmission).values({ name, email, subject, message })

    // Send email — failure is non-fatal; submission is already persisted
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "portfolio@kondwanimuwowo.com",
        to: process.env.RESEND_TO_EMAIL ?? "kondwanimuwowo@gmail.com",
        replyTo: email,
        subject: subject ? `Portfolio: ${subject}` : "Portfolio: New message",
        text: `Name: ${name}\nEmail: ${email}${subject ? `\nSubject: ${subject}` : ""}\n\n${message}`,
      })
    } catch (emailErr) {
      console.error("[contact] email delivery failed", emailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[contact]", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
