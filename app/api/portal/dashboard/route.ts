import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the client linked to this user
    const client = await db.query.client.findFirst({
      where: (t, { eq }) => eq(t.userId, user.id),
    })

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const clientId = client.id

    // Fetch projects with their tasks and milestones
    const projects = await db.query.workProject.findMany({
      where: (t, { eq }) => eq(t.clientId, clientId),
      with: {
        tasks: {
          orderBy: (t, { asc }) => asc(t.position),
        },
        milestones: {
          orderBy: (t, { asc }) => asc(t.position),
          with: {
            invoice: true,
          },
        },
      },
      orderBy: (t, { desc }) => desc(t.updatedAt),
    })

    // Fetch documents (invoices, proposals, etc.)
    const documents = await db.query.document.findMany({
      where: (t, { eq }) => eq(t.clientId, clientId),
      with: {
        items: {
          orderBy: (t, { asc }) => asc(t.position),
        },
      },
      orderBy: (t, { desc }) => desc(t.issueDate),
    })

    // Fetch contracts
    const contracts = await db.query.contract.findMany({
      where: (t, { eq }) => eq(t.clientId, clientId),
      orderBy: (t, { desc }) => desc(t.updatedAt),
    })

    // Fetch retainers
    const retainers = await db.query.retainerContract.findMany({
      where: (t, { eq }) => eq(t.clientId, clientId),
      orderBy: (t, { desc }) => desc(t.startDate),
    })

    return NextResponse.json({
      client,
      projects,
      documents,
      contracts,
      retainers,
    })
  } catch (error: any) {
    console.error("Portal dashboard API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
