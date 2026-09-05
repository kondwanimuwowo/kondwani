import { NextResponse } from "next/server"
import { db, projectMessage } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const messages = await db.query.projectMessage.findMany({
    where: (t, { eq }) => eq(t.projectId, id),
    orderBy: (t, { asc }) => asc(t.createdAt),
  })
  return NextResponse.json(messages)
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

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 })
  }

  const name = user.user_metadata?.full_name ?? "Kondwani Muwowo"

  const [message] = await db.insert(projectMessage).values({
    projectId,
    senderId: user.id,
    senderName: name,
    senderRole: "developer",
    content: body.content,
    attachments: body.attachments ?? [],
  }).returning()

  // Optional: Trigger notification to the client if they have an email (non-blocking)
  try {
    const project = await db.query.workProject.findFirst({
      where: (t, { eq }) => eq(t.id, projectId),
      with: { client: true },
    })

    if (project?.client?.email && process.env.RESEND_API_KEY) {
      const { Resend } = require("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"
      const portalUrl = `${process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://kondwanimuwowo.com/portal"}?project=${projectId}`
      
      await resend.emails.send({
        from: `Kondwani Muwowo <${fromEmail}>`,
        to: project.client.email,
        subject: `New message on project: ${project.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <h3 style="color: #1a1a1a;">New message from Kondwani</h3>
            <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0A0A0A; border-radius: 4px; font-style: italic;">"${body.content}"</p>
            <p>You can reply directly in the client portal:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${portalUrl}" style="background-color: #0A0A0A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Open Client Portal</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Best regards,<br/>Kondwani Muwowo</p>
          </div>
        `
      })
    }
  } catch (err) {
    console.error("Failed to send message notification email:", err)
  }

  return NextResponse.json(message, { status: 201 })
}
