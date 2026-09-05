"use client"

import { useState } from "react"

interface Props {
  token: string
  currency: string
  total: number
}

export function PaymentWidget({ token, currency, total }: Props) {
  const [activeTab, setActiveTab] = useState<"momo" | "bank">("momo")

  // Mobile money state
  const [phone, setPhone] = useState("")
  const [network, setNetwork] = useState("airtel")
  const [momoLoading, setMomoLoading] = useState(false)
  const [momoStatus, setMomoStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  // Bank transfer state
  const [file, setFile] = useState<File | null>(null)
  const [bankLoading, setBankLoading] = useState(false)
  const [bankStatus, setBankStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  const handleMomoPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || momoLoading) return

    setMomoLoading(true)
    setMomoStatus(null)

    try {
      const res = await fetch("/api/lenco/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone, network }),
      })

      const data = await res.json()

      if (res.ok) {
        setMomoStatus({
          type: "success",
          msg: data.message || "USSD push sent. Confirm with your PIN.",
        })
      } else {
        setMomoStatus({
          type: "error",
          msg: data.error || "Failed to initiate payment. Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      setMomoStatus({
        type: "error",
        msg: "A network error occurred. Please try again.",
      })
    } finally {
      setMomoLoading(false)
    }
  }

  const handleBankReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || bankLoading) return

    setBankLoading(true)
    setBankStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/invoices/${token}/receipt`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setBankStatus({
          type: "success",
          msg: "Receipt uploaded. We are verifying your transfer.",
        })
        setFile(null)
      } else {
        setBankStatus({
          type: "error",
          msg: data.error || "Failed to upload receipt. Please try again.",
        })
      }
    } catch (err) {
      console.error(err)
      setBankStatus({
        type: "error",
        msg: "A network error occurred. Please try again.",
      })
    } finally {
      setBankLoading(false)
    }
  }

  // ZMW Mobile Money Conversion Rate Display
  const usdToZmwRate = 26.5
  const convertedZMW = currency.toUpperCase() === "USD" ? total * usdToZmwRate : total

  return (
    <div className="w-full bg-white rounded-3xl shadow-md overflow-hidden font-sans">
      <div className="bg-surface px-6 py-4 flex items-center justify-between">
        <h3 className="font-bold text-sm tracking-tight text-foreground">Secure payment</h3>
        <span className="text-xs font-mono font-bold text-muted bg-neutral-bg px-2.5 py-1 rounded-full">
          {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex px-6 pt-4 pb-2 bg-surface gap-2">
        <button
          onClick={() => setActiveTab("momo")}
          className={`px-4 py-2 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-colors ${
            activeTab === "momo" ? "bg-primary text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Mobile Money
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`px-4 py-2 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-colors ${
            activeTab === "bank" ? "bg-primary text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Bank Transfer
        </button>
      </div>

      <div className="p-6">

        {/* MOBILE MONEY TAB */}
        {activeTab === "momo" && (
          <form onSubmit={handleMomoPayment} className="space-y-4">
            <div className="bg-danger-bg rounded-3xl p-4 text-xs text-danger leading-relaxed font-medium">
              Supports <strong>MTN, Airtel, Zamtel</strong> (Zambia only).
              {currency.toUpperCase() === "USD" && (
                <div className="mt-1 font-mono font-bold">
                  Conversion: ZMW {convertedZMW.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Rate: 1 USD = 26.5 ZMW)
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 font-mono">
                  Operator Network
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-surface border border-border rounded-3xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-tint"
                >
                  <option value="airtel">Airtel Money</option>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="zamtel">Zamtel Kwacha</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 font-mono">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0977123456"
                  className="w-full bg-surface border border-border rounded-3xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-tint"
                />
              </div>
            </div>

            {momoStatus && (
              <div className={`p-4 rounded-3xl text-xs font-mono ${
                momoStatus.type === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
              }`}>
                {momoStatus.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={momoLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {momoLoading ? "Triggering PIN prompt..." : `Pay ZMW ${convertedZMW.toLocaleString(undefined, { minimumFractionDigits: 2 })} now`}
            </button>
          </form>
        )}

        {/* BANK TRANSFER TAB */}
        {activeTab === "bank" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-3xl p-4 bg-surface">
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-foreground">Standard bank account details</h4>
                <div><span className="text-muted">Bank Name:</span> <strong className="text-foreground">Zambia National Commercial Bank (Zanaco)</strong></div>
                <div><span className="text-muted">Account Name:</span> <strong className="text-foreground">Kondwani Muwowo</strong></div>
                <div><span className="text-muted">Account Number:</span> <strong className="font-mono text-foreground">5817293021</strong></div>
                <div><span className="text-muted">Branch Name:</span> <strong className="text-foreground">Lusaka Main Branch</strong></div>
                <div><span className="text-muted">Swift Code:</span> <strong className="font-mono text-foreground">ZANAZMLUXXX</strong></div>
              </div>

              <form onSubmit={handleBankReceiptUpload} className="space-y-3 flex flex-col justify-between">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 font-mono">
                    Upload Bank Receipt Image / PDF
                  </label>
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary-tint file:text-primary"
                  />
                </div>

                {bankStatus && (
                  <div className={`p-3 rounded-3xl text-[10px] font-mono ${
                    bankStatus.type === "success" ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
                  }`}>
                    {bankStatus.msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file || bankLoading}
                  className="w-full bg-foreground hover:bg-primary text-white py-2.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {bankLoading ? "Uploading file..." : "Submit receipt for verification"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
