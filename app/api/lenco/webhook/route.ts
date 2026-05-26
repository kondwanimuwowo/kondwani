import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  // Verify shared secret — configure LENCO_WEBHOOK_SECRET in your Lenco dashboard
  // and set the same value in your environment variables.
  const secret = process.env.LENCO_WEBHOOK_SECRET
  if (secret) {
    const incoming =
      req.headers.get("x-lenco-token") ??
      req.headers.get("x-lenco-signature") ??
      req.headers.get("authorization")?.replace("Bearer ", "")
    if (incoming !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const body = await req.json()

    const event = body.event as string | undefined
    const transactionData = body.data as {
      reference?: string
      status?: string
      amount?: number
      currency?: string
    } | undefined

    if (!transactionData) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const { reference, status, amount, currency } = transactionData

    if (!reference) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 })
    }

    const doc = await prisma.document.findFirst({
      where: { paymentRef: reference },
      include: { client: true },
    })

    if (!doc) {
      // Return 200 so Lenco does not keep retrying for unknown references
      return NextResponse.json({ message: "No matching invoice" })
    }

    const isSuccess =
      event === "collection.successful" ||
      event === "collection.completed" ||
      status === "successful" ||
      status === "success" ||
      status === "completed"

    if (isSuccess) {
      if (doc.status === "paid") {
        return NextResponse.json({ message: "Already paid" })
      }

      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "paid" },
      })

      if (doc.milestoneId) {
        await prisma.billingMilestone.update({
          where: { id: doc.milestoneId },
          data: { status: "paid" },
        })
      }

      try {
        if (process.env.RESEND_API_KEY) {
          const { Resend } = require("resend")
          const resend = new Resend(process.env.RESEND_API_KEY)
          const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"
          const portalUrl = process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/portal`
            : "https://kondwanimuwowo.com/portal"

          const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 24px; font-weight: 900; color: #1a1a1a;">[&lt;ondwani</span>
              </div>
              <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; text-align: center;">Payment Received — Thank You!</h2>
              <p>Hello ${doc.client.name},</p>
              <p>We have successfully received your payment for Invoice <strong>${doc.number}</strong> via Mobile Money.</p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; font-weight: bold; color: #166534; width: 120px;">Invoice:</td><td style="padding: 6px 0; color: #111;">${doc.number}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold; color: #166534;">Amount Paid:</td><td style="padding: 6px 0; color: #111; font-weight: bold;">${currency ?? doc.currency} ${(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold; color: #166534;">Method:</td><td style="padding: 6px 0; color: #111;">Mobile Money (Zambia)</td></tr>
                  <tr><td style="padding: 6px 0; font-weight: bold; color: #166534;">Reference:</td><td style="padding: 6px 0; color: #111; font-family: monospace;">${reference}</td></tr>
                </table>
              </div>
              <p>You can view the fully paid invoice in your client portal.</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${portalUrl}" style="background-color: #0A0A0A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 13px;">Go to Client Portal</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">Best regards,<br/>Kondwani Muwowo Studio</p>
            </div>
          `

          await Promise.all([
            resend.emails.send({
              from: `Kondwani Muwowo Billing <${fromEmail}>`,
              to: doc.client.email,
              subject: `[Receipt] Payment Received - Invoice ${doc.number}`,
              html: emailHtml,
            }),
            resend.emails.send({
              from: `Kondwani Muwowo Billing <${fromEmail}>`,
              to: "kondwanimuwowo@gmail.com",
              subject: `[ALERT] Client Paid Invoice ${doc.number}`,
              html: emailHtml,
            }),
          ])
        }
      } catch (emailErr) {
        console.error("[webhook] email delivery failed", emailErr)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ message: "No action for this status" })
  } catch (error) {
    console.error("[lenco-webhook]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
