import { NextResponse } from "next/server"
import { db, document } from "@/lib/db"
import { eq } from "drizzle-orm"

// Constant exchange rate for USD to ZMW mobile money billing
const USD_TO_ZMW_RATE = 26.5

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, phone, network } = body

    if (!token || !phone || !network) {
      return NextResponse.json(
        { error: "Missing required fields (token, phone, network)" },
        { status: 400 }
      )
    }

    // Retrieve invoice by token
    const doc = await db.query.document.findFirst({
      where: (t, { eq }) => eq(t.token, token),
      with: { items: true, client: true },
    })

    if (!doc) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (doc.status === "paid") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    // Calculate total amount
    const subtotal = doc.items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = subtotal * (doc.taxRate / 100)
    const totalAmount = subtotal + taxAmount

    // Convert to ZMW if the invoice is in USD
    let amountInZMW = totalAmount
    if (doc.currency.toUpperCase() === "USD") {
      amountInZMW = totalAmount * USD_TO_ZMW_RATE
    }

    // Round to 2 decimal places
    amountInZMW = Math.round(amountInZMW * 100) / 100

    // Format phone number to international format (Zambia 260)
    let formattedPhone = phone.trim().replace(/[\s+]/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "260" + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith("260")) {
      formattedPhone = "260" + formattedPhone
    }

    // Generate unique payment reference
    const timestamp = Date.now()
    const paymentRef = `pay_${doc.id.substring(0, 8)}_${timestamp}`

    // Update document with payment reference
    await db.update(document).set({ paymentRef }).where(eq(document.id, doc.id))

    if (!process.env.LENCO_API_KEY) {
      return NextResponse.json({
        success: true,
        message: "USSD Push sent to your phone. Please confirm with your PIN to complete payment.",
        paymentRef,
        mockMode: true,
      })
    }

    // Call Lenco Mobile Money collection API
    const response = await fetch("https://api.lenco.co/access/v2/collections/mobile-money", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LENCO_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: amountInZMW,
        currency: "ZMW",
        phone: formattedPhone,
        network: network.toLowerCase(),
        reference: paymentRef,
        narrative: `Payment for Invoice ${doc.number}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://kondwanimuwowo.com"}/api/lenco/webhook`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Lenco API error details:", data)
      return NextResponse.json(
        { error: data.message || "Failed to initiate mobile money collection with Lenco" },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "USSD Push sent to your phone. Please confirm with your PIN to complete payment.",
      paymentRef,
    })
  } catch (error: any) {
    console.error("Lenco collection error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
