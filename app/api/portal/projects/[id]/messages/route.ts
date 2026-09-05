import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db, projectMessage } from "@/lib/db"

// Get messages for a specific project
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify client and project ownership
    const client = await db.query.client.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    })

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const proj = await db.query.workProject.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, projectId), eq(t.clientId, client.id)),
    })

    if (!proj) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    const messages = await db.query.projectMessage.findMany({
      where: (t, { eq }) => eq(t.projectId, projectId),
      orderBy: (t, { asc }) => asc(t.createdAt),
    })

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Portal fetch messages error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Post a new message from the client
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

    const { id: projectId } = await params
    const body = await req.json()

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 })
    }

    // Verify client and project ownership
    const client = await db.query.client.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    })

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const proj = await db.query.workProject.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, projectId), eq(t.clientId, client.id)),
    })

    if (!proj) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    const name = client.name || user.user_metadata?.full_name || "Client"

    const [message] = await db.insert(projectMessage).values({
      projectId,
      senderId: user.id,
      senderName: name,
      senderRole: "client",
      content: body.content,
      attachments: body.attachments ?? [],
    }).returning()

    // Notify the developer (non-blocking)
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"
        // Developer email defaults to kondwanimuwowo@gmail.com
        const devEmail = "kondwanimuwowo@gmail.com"
        const adminUrl = `${process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.kondwanimuwowo.com"}/work/${projectId}`

        await resend.emails.send({
          from: `Kondwani Muwowo Studio <${fromEmail}>`,
          to: devEmail,
          subject: `[Studio Chat] New client message on: ${proj.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <h3 style="color: #1a1a1a;">New message from ${name} (${client.company ?? "No Company"})</h3>
              <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #990000; border-radius: 4px; font-style: italic;">"${body.content}"</p>
              <p>You can reply directly in the Admin Studio:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${adminUrl}" style="background-color: #990000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Open Admin Studio</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Kondwani Muwowo Studio Portal Alerts</p>
            </div>
          `
        })
      }
    } catch (err) {
      console.error("Failed to send message notification email to dev:", err)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error("Portal post message error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
