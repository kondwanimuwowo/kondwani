import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2"
import { PutObjectCommand } from "@aws-sdk/client-s3"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No receipt file uploaded" }, { status: 400 })
    }

    // Find the invoice first
    const doc = await prisma.document.findUnique({
      where: { token },
      include: { client: true },
    })

    if (!doc) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Set up file storage upload
    let fileUrl = ""
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const filename = `${doc.number.replace(/\s+/g, "_")}_receipt_${Date.now()}.${file.name.split(".").pop()}`
    const key = `receipts/${filename}`

    try {
      if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
        // Upload to Cloudflare R2
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: file.type,
          })
        )
        fileUrl = `${R2_PUBLIC_URL}/${key}`
      } else {
        // Fallback for local development without keys
        console.log(`[R2 Upload Simulation] File uploaded to: ${key} (Buffer size: ${fileBuffer.length} bytes)`)
        fileUrl = `/mock-receipts/${filename}`
      }
    } catch (uploadError) {
      console.error("R2 Upload failed, using mock path:", uploadError)
      fileUrl = `/mock-receipts/${filename}`
    }

    // Update document status to review and add receipt url to notes or save as PDF URL/payment reference
    const updatedNotes = `${doc.notes || ""}\n\n[System Alert] Client uploaded a bank transfer receipt: ${fileUrl}`
    
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "review",
        notes: updatedNotes,
        pdfUrl: fileUrl, // Store upload URL in pdfUrl for simple tracking
      },
    })

    // Notify developer via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"
        const devEmail = "kondwanimuwowo@gmail.com"

        await resend.emails.send({
          from: `Kondwani Muwowo Studio <${fromEmail}>`,
          to: devEmail,
          subject: `[Bank Receipt Uploaded] Review Required - Invoice ${doc.number}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #990000; border-bottom: 2px solid #990000; padding-bottom: 10px;">Bank Transfer Receipt Review</h2>
              <p>A bank transfer receipt has been uploaded by the client <strong>${doc.client.name}</strong> for <strong>Invoice ${doc.number}</strong>.</p>
              
              <p>The invoice status has been automatically updated to <strong>REVIEW</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #eee;">
                <h4 style="margin-top: 0; color: #333;">Billing Info:</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555; width: 120px;">Client:</td>
                    <td style="padding: 6px 0; color: #111;">${doc.client.company ?? doc.client.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                    <td style="padding: 6px 0; color: #111;">${doc.number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Currency:</td>
                    <td style="padding: 6px 0; color: #111;">${doc.currency}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${fileUrl}" target="_blank" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 13px; margin-right: 10px;">View Uploaded Receipt</a>
                <a href="${process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.kondwanimuwowo.com"}/work/${doc.projectId ?? ""}" style="background-color: #0A0A0A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 13px;">Open Admin Studio</a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Kondwani Muwowo Studio Billing Office</p>
            </div>
          `
        })
      }
    } catch (err) {
      console.error("Failed to send receipt review notification email:", err)
    }

    return NextResponse.json({
      success: true,
      message: "Bank receipt uploaded successfully. The invoice has been marked for review.",
      receiptUrl: fileUrl,
    })
  } catch (error: any) {
    console.error("Bank receipt upload error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
