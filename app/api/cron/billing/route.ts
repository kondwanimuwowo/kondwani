import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Advance date helper by frequency
function getNextBillingDate(current: Date, frequency: string): Date {
  const next = new Date(current)
  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1)
  } else if (frequency === "quarterly") {
    next.setMonth(next.getMonth() + 3)
  } else if (frequency === "annually") {
    next.setFullYear(next.getFullYear() + 1)
  } else {
    // Default to monthly if invalid
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

function generateSecureToken(): string {
  return crypto.randomUUID()
}

export async function GET(req: Request) {
  try {
    // Check authorization header
    const authHeader = req.headers.get("Authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    const stats = {
      retainersInvoiced: 0,
      milestonesInvoiced: 0,
      remindersSent: 0,
    }

    // Load Resend
    let resend: any = null
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "billing@kondwanimuwowo.com"
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require("resend")
      resend = new Resend(process.env.RESEND_API_KEY)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Process Due Retainer Contracts
    // ──────────────────────────────────────────────────────────────────────────
    const dueRetainers = await prisma.retainerContract.findMany({
      where: {
        status: "active",
        nextInvoiceAt: { lte: today },
      },
      include: { client: true },
    })

    for (const retainer of dueRetainers) {
      const token = generateSecureToken()
      const invNumber = `INV-RET-${retainer.id.substring(0, 4)}-${Date.now().toString().substring(8)}`
      
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14) // 14 days grace period for retainers

      // Create draft invoice
      const invoice = await prisma.document.create({
        data: {
          type: "invoice",
          number: invNumber,
          clientId: retainer.clientId,
          projectId: retainer.projectId,
          retainerId: retainer.id,
          status: "sent",
          issueDate: new Date(),
          dueDate,
          currency: retainer.currency,
          token,
          items: {
            create: {
              description: `Recurring Service: ${retainer.title} (${retainer.frequency} retainer cycle)`,
              quantity: 1,
              rate: retainer.amount,
              amount: retainer.amount,
            },
          },
        },
      })

      // Email invoice link to client
      if (resend && retainer.client.email) {
        const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://kondwanimuwowo.com"}/i/${token}`
        await resend.emails.send({
          from: `Kondwani Muwowo Billing <${fromEmail}>`,
          to: retainer.client.email,
          subject: `Invoice ${invNumber} for ${retainer.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <span style="font-size: 20px; font-weight: 800; color: #1a1a1a;">[&lt;ondwani</span>
              <h3 style="color: #1a1a1a; margin-top: 15px;">New Recurring Invoice Issued</h3>
              <p>Hello ${retainer.client.name},</p>
              <p>A new recurring invoice has been generated for your active retainer plan <strong>"${retainer.title}"</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #eee;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555; width: 120px;">Invoice:</td>
                    <td style="padding: 6px 0; color: #111;">${invNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Due Date:</td>
                    <td style="padding: 6px 0; color: #111;">${dueDate.toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Total Due:</td>
                    <td style="padding: 6px 0; color: #990000; font-weight: bold;">${retainer.currency} ${retainer.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${portalUrl}" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Pay Invoice Securely</a>
              </div>
              
              <p style="font-size: 12px; color: #888;">If you have any questions or require custom bank transfer channels, please let me know by replying to this email.</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Best regards,<br/>Kondwani Muwowo Studio Billing Office</p>
            </div>
          `
        })
      }

      // Advance nextInvoiceAt
      const nextDate = getNextBillingDate(retainer.nextInvoiceAt, retainer.frequency)
      await prisma.retainerContract.update({
        where: { id: retainer.id },
        data: {
          lastInvoicedAt: new Date(),
          nextInvoiceAt: nextDate,
        },
      })

      stats.retainersInvoiced++
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Process Billing Milestones Due
    // ──────────────────────────────────────────────────────────────────────────
    const dueMilestones = await prisma.billingMilestone.findMany({
      where: {
        status: "pending",
        dueDate: { lte: today },
      },
      include: {
        project: {
          include: { client: true },
        },
      },
    })

    for (const milestone of dueMilestones) {
      if (!milestone.project.clientId || !milestone.project.client) continue

      const token = generateSecureToken()
      const invNumber = `INV-MS-${milestone.id.substring(0, 4)}-${Date.now().toString().substring(8)}`
      
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // 7 days payment grace period for project milestones

      // Create draft invoice
      const invoice = await prisma.document.create({
        data: {
          type: "invoice",
          number: invNumber,
          clientId: milestone.project.clientId,
          projectId: milestone.projectId,
          milestoneId: milestone.id,
          status: "sent",
          issueDate: new Date(),
          dueDate,
          currency: milestone.project.currency,
          token,
          items: {
            create: {
              description: `Project Milestone Completion: ${milestone.title} (${milestone.percentage ? milestone.percentage + "%" : "Installment"})`,
              quantity: 1,
              rate: milestone.amount,
              amount: milestone.amount,
            },
          },
        },
      })

      // Update milestone status to invoiced
      await prisma.billingMilestone.update({
        where: { id: milestone.id },
        data: { status: "invoiced" },
      })

      const client = milestone.project.client

      // Email invoice link to client
      if (resend && client.email) {
        const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://kondwanimuwowo.com"}/i/${token}`
        await resend.emails.send({
          from: `Kondwani Muwowo Billing <${fromEmail}>`,
          to: client.email,
          subject: `Milestone Invoice ${invNumber} for ${milestone.project.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <span style="font-size: 20px; font-weight: 800; color: #1a1a1a;">[&lt;ondwani</span>
              <h3 style="color: #1a1a1a; margin-top: 15px;">New Project Milestone Invoice</h3>
              <p>Hello ${client.name},</p>
              <p>An invoice has been generated for a due billing milestone on your project: <strong>"${milestone.project.title}"</strong>.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #eee;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555; width: 120px;">Milestone Title:</td>
                    <td style="padding: 6px 0; color: #111;">${milestone.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                    <td style="padding: 6px 0; color: #111;">${invNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Due Date:</td>
                    <td style="padding: 6px 0; color: #111;">${dueDate.toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #555;">Total Due:</td>
                    <td style="padding: 6px 0; color: #990000; font-weight: bold;">${milestone.project.currency} ${milestone.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${portalUrl}" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Pay Milestone Invoice</a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Best regards,<br/>Kondwani Muwowo Studio Billing Office</p>
            </div>
          `
        })
      }

      stats.milestonesInvoiced++
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Process Overdue Reminders
    // ──────────────────────────────────────────────────────────────────────────
    const overdueInvoices = await prisma.document.findMany({
      where: {
        status: "sent",
        type: "invoice",
        dueDate: { lt: today },
      },
      include: { client: true, items: true },
    })

    for (const inv of overdueInvoices) {
      if (resend && inv.client.email) {
        const subtotal = inv.items.reduce((sum, item) => sum + item.amount, 0)
        const taxAmount = subtotal * (inv.taxRate / 100)
        const total = subtotal + taxAmount
        const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://kondwanimuwowo.com"}/i/${inv.token}`

        await resend.emails.send({
          from: `Kondwani Muwowo Billing <${fromEmail}>`,
          to: inv.client.email,
          subject: `[REMINDER] Invoice ${inv.number} is Overdue`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
              <span style="font-size: 20px; font-weight: 800; color: #1a1a1a;">[&lt;ondwani</span>
              <h3 style="color: #990000; margin-top: 15px;">Payment Reminder: Overdue Invoice</h3>
              <p>Hello ${inv.client.name},</p>
              <p>This is a friendly reminder that Invoice <strong>${inv.number}</strong> is currently overdue. We kindly request that you settle this invoice at your earliest convenience.</p>
              
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #fca5a5;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #990000; width: 120px;">Invoice:</td>
                    <td style="padding: 6px 0; color: #111;">${inv.number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #990000;">Due Date:</td>
                    <td style="padding: 6px 0; color: #111; font-weight: bold;">${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #990000;">Amount Overdue:</td>
                    <td style="padding: 6px 0; color: #990000; font-weight: bold;">${inv.currency} ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${portalUrl}" style="background-color: #990000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">Settle Invoice Now</a>
              </div>
              
              <p style="font-size: 12px; color: #666;">Thank you for your business. If you have already processed this payment, please disregard this reminder or upload a transfer copy in the payment page.</p>
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">Best regards,<br/>Kondwani Muwowo Studio Billing Office</p>
            </div>
          `
        })
      }

      stats.remindersSent++
    }

    return NextResponse.json({
      success: true,
      message: "Daily billing cron executed successfully.",
      stats,
    })
  } catch (error: any) {
    console.error("Cron billing error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
