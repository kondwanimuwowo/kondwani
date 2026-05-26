import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the client linked to this user
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
    })

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }

    const clientId = client.id

    // Fetch projects with their tasks and milestones
    const projects = await prisma.workProject.findMany({
      where: { clientId },
      include: {
        tasks: {
          orderBy: { position: "asc" },
        },
        milestones: {
          orderBy: { position: "asc" },
          include: {
            invoice: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Fetch documents (invoices, proposals, etc.)
    const documents = await prisma.document.findMany({
      where: { clientId },
      include: {
        items: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { issueDate: "desc" },
    })

    // Fetch contracts
    const contracts = await prisma.contract.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
    })

    // Fetch retainers
    const retainers = await prisma.retainerContract.findMany({
      where: { clientId },
      orderBy: { startDate: "desc" },
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
