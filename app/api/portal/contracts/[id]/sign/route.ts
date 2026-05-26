import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: contractId } = await params
    const body = await req.json()

    const { signatureName, signatureEmail } = body

    if (!signatureName?.trim() || !signatureEmail?.trim()) {
      return NextResponse.json(
        { error: "Signature name and email are required" },
        { status: 400 }
      )
    }

    // Verify client and contract ownership
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
    })

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        clientId: client.id,
      },
    })

    if (!contract) {
      return NextResponse.json({ error: "Contract not found or unauthorized" }, { status: 404 })
    }

    if (contract.status === "signed") {
      return NextResponse.json({ error: "Contract is already signed" }, { status: 400 })
    }

    // Extract IP address from request headers
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1"

    const signedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: "signed",
        signedAt: new Date(),
        signatureName,
        signatureEmail,
        signatureIp: ip,
      },
    })

    // Notify developer and client via Resend (non-blocking)
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"
        const devEmail = "kondwanimuwowo@gmail.com"

        const emailContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #990000; padding-bottom: 10px;">Contract Signed Digitally</h2>
            <p>The contract <strong>"${contract.title}"</strong> has been successfully signed by <strong>${signatureName}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #eee;">
              <h4 style="margin-top: 0; color: #333;">Signing Details:</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555; width: 120px;">Signed By:</td>
                  <td style="padding: 6px 0; color: #111;">${signatureName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">Email:</td>
                  <td style="padding: 6px 0; color: #111;">${signatureEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">IP Address:</td>
                  <td style="padding: 6px 0; color: #111; font-family: monospace;">${ip}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #555;">Timestamp:</td>
                  <td style="padding: 6px 0; color: #111;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <p>This digital signature is legally binding and has been logged in the systems.</p>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Kondwani Muwowo Studio Portal Alerts</p>
          </div>
        `

        // Send to Developer
        await resend.emails.send({
          from: `Kondwani Muwowo Studio <${fromEmail}>`,
          to: devEmail,
          subject: `[Contract Signed] ${contract.title} - ${signatureName}`,
          html: emailContent,
        })

        // Send copy to Client
        await resend.emails.send({
          from: `Kondwani Muwowo Studio <${fromEmail}>`,
          to: client.email,
          subject: `[Signed Copy] ${contract.title}`,
          html: emailContent,
        })
      }
    } catch (err) {
      console.error("Failed to send contract signing confirmation emails:", err)
    }

    return NextResponse.json(signedContract)
  } catch (error: any) {
    console.error("Portal sign contract error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
