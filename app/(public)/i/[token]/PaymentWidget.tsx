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
          msg: data.message || "USSD Push sent! Confirm with your PIN.",
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
          msg: "Receipt uploaded successfully! We are verifying your transfer.",
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
    <div className="w-full bg-white border border-border rounded-2xl shadow-sm overflow-hidden font-sans">
      <div className="border-b border-border bg-[#fafafa] px-6 py-4 flex items-center justify-between">
        <h3 className="font-bold text-sm tracking-tight text-foreground">Secure Payment Station</h3>
        <span className="text-xs font-mono font-bold text-muted bg-neutral-100 px-2.5 py-1 rounded-md">
          {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6 pt-3 bg-[#fafafa] gap-2">
        <button
          onClick={() => setActiveTab("momo")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "momo"
              ? "border-red-700 text-red-700"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Mobile Money
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "bank"
              ? "border-red-700 text-red-700"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Bank Transfer Fallback
        </button>
      </div>

      <div className="p-6">
        
        {/* MOBILE MONEY TAB */}
        {activeTab === "momo" && (
          <form onSubmit={handleMomoPayment} className="space-y-4">
            <div className="bg-[#fcf8f8] border border-red-100 rounded-xl p-4 text-xs text-red-900 leading-relaxed font-medium">
              📱 Supports <strong>MTN, Airtel, Zamtel</strong> (Zambia only). 
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
                  className="w-full bg-[#fdfdfd] border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-red-700"
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
                  className="w-full bg-[#fdfdfd] border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-red-700"
                />
              </div>
            </div>

            {momoStatus && (
              <div className={`p-4 rounded-xl text-xs font-mono border ${
                momoStatus.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                {momoStatus.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={momoLoading}
              className="w-full bg-red-800 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {momoLoading ? "Triggering PIN Prompt..." : `Pay ZMW ${convertedZMW.toLocaleString(undefined, { minimumFractionDigits: 2 })} Now`}
            </button>
          </form>
        )}

        {/* BANK TRANSFER TAB */}
        {activeTab === "bank" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border rounded-xl p-4 bg-[#fafafa]">
              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-foreground">Standard Bank Account Details:</h4>
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
                    className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                </div>

                {bankStatus && (
                  <div className={`p-3 rounded-xl text-[10px] font-mono border ${
                    bankStatus.type === "success" 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {bankStatus.msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!file || bankLoading}
                  className="w-full bg-[#0a0a0a] hover:bg-neutral-800 text-white py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  {bankLoading ? "Uploading File..." : "Submit Receipt for Verification"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
