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

    // Try to find client by Supabase User ID
    let client = await prisma.client.findUnique({
      where: { userId: user.id },
    })

    // If not found, check if there is a client with this email that hasn't been linked yet
    if (!client && user.email) {
      const existingClient = await prisma.client.findUnique({
        where: { email: user.email },
      })

      if (existingClient && !existingClient.userId) {
        // Link client to this user id
        client = await prisma.client.update({
          where: { id: existingClient.id },
          data: { userId: user.id },
        })
      }
    }

    if (!client) {
      return NextResponse.json(
        {
          error: "Client profile not found. Please contact Kondwani to register your email.",
          email: user.email,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error: any) {
    console.error("Portal profile error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
