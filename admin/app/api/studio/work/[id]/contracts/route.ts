import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { Resend } from "resend"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const contracts = await prisma.contract.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(contracts)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const body = await req.json()

  // Find project and its client
  const project = await prisma.workProject.findUnique({
    where: { id: projectId },
    include: { client: true },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }
  if (!project.clientId) {
    return NextResponse.json({ error: "Project has no client assigned" }, { status: 400 })
  }

  const token = nanoid(16)

  const contract = await prisma.contract.create({
    data: {
      projectId,
      clientId: project.clientId,
      title: body.title,
      content: body.content,
      status: "draft",
      token,
    },
  })

  return NextResponse.json(contract, { status: 201 })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: projectId } = await params
  const body = await req.json()
  const { contractId, action, ...fields } = body

  if (!contractId) {
    return NextResponse.json({ error: "Contract ID is required" }, { status: 400 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId, projectId },
    include: { client: true, project: true },
  })

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  // Handle action=send
  if (action === "send" || body.status === "sent") {
    if (contract.status === "signed") {
      return NextResponse.json({ error: "Contract is already signed" }, { status: 400 })
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: { status: "sent" },
    })

    // Send email via Resend
    const portalUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://kondwanimuwowo.com/portal"}?contract=${contract.token}`
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"

    if (process.env.RESEND_API_KEY && contract.client.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: `Kondwani Muwowo <${fromEmail}>`,
          to: contract.client.email,
          subject: `Contract for signature: ${contract.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h2 style="color: #1a1a1a; margin-top: 0;">Contract Signature Request</h2>
              <p>Hi ${contract.client.name},</p>
              <p>I have prepared the contract for our project: <strong>${contract.project?.title ?? contract.title}</strong>.</p>
              <p>Please click the button below to review, accept, and digitally sign the contract:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" style="background-color: #0A0A0A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 500;">Review & Sign Contract</a>
              </div>
              <p style="font-size: 14px; color: #666;">If the button above does not work, copy and paste this URL into your browser:</p>
              <p style="font-size: 14px; color: #0066cc; word-break: break-all;">${portalUrl}</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 14px; color: #999;">Best regards,<br/>Kondwani Muwowo</p>
            </div>
          `,
        })
      } catch (err: any) {
        console.error("Failed to send contract email:", err)
      }
    }

    return NextResponse.json(updated)
  }

  // Regular field updates
  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      ...(fields.title !== undefined && { title: fields.title }),
      ...(fields.content !== undefined && { content: fields.content }),
      ...(fields.status !== undefined && { status: fields.status }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get("contractId")

  if (!contractId) {
    return NextResponse.json({ error: "Contract ID is required" }, { status: 400 })
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  })

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (contract.status === "signed") {
    return NextResponse.json({ error: "Cannot delete a signed contract" }, { status: 400 })
  }

  await prisma.contract.delete({
    where: { id: contractId },
  })

  return NextResponse.json({ ok: true })
}
