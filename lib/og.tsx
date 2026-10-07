import { ImageResponse } from "next/og"

export interface OgCard {
  title: string
  subtitle?: string | null
  meta?: string | null
  image?: string | null
}

const WIDTH = 1200
const HEIGHT = 630
const COLORS = { white: "#FFFFFF", ink: "#0A0A0A", muted: "#6B7280", primary: "#7E1416", primaryTint: "#F2E5E5", surface: "#F8F9FA", border: "#E5E7EB" }

// Google serves TTF to clients that don't send a browser user agent, which is what satori needs
async function loadInter(weight: number): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`)).text()
  const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!src) throw new Error("Inter font URL not found")
  return (await fetch(src)).arrayBuffer()
}

let fontsPromise: Promise<{ name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" }[]> | null = null

function loadFonts() {
  fontsPromise ??= Promise.all([loadInter(500), loadInter(700)])
    .then(([medium, bold]) => [
      { name: "Inter", data: medium, weight: 500 as const, style: "normal" as const },
      { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
    ])
    .catch(() => {
      fontsPromise = null
      return []
    })
  return fontsPromise
}

// Embeds the screenshot as a data URL so a slow or unsupported image drops out instead of failing the card
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok || !/^image\/(png|jpe?g)/.test(type)) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.length > 5_000_000) return null
    let binary = ""
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return `data:${type.split(";")[0]};base64,${btoa(binary)}`
  } catch {
    return null
  }
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}...` : text
}

const RESPONSE_OPTIONS = {
  width: WIDTH,
  height: HEIGHT,
  headers: { "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
}

// Cards without a screenshot use a centred layout on solid primary, after the Smile FX Traders cards
function centredCard(card: OgCard) {
  const titleSize = card.title.length > 40 ? 60 : 76
  return (
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: COLORS.primary, fontFamily: "Inter", padding: 96 }}>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: COLORS.white }}>[&lt;ondwani</div>
      <div style={{ display: "flex", marginTop: 40, fontSize: titleSize, fontWeight: 700, color: COLORS.white, lineHeight: 1.1, letterSpacing: -1, textAlign: "center", justifyContent: "center" }}>
        {clip(card.title, 80)}
      </div>
      {card.subtitle && (
        <div style={{ display: "flex", marginTop: 40, padding: "12px 32px", borderRadius: 999, background: COLORS.primaryTint, color: COLORS.primary, fontSize: 26, fontWeight: 500, textAlign: "center" }}>
          {clip(card.subtitle, 90)}
        </div>
      )}
      <div style={{ display: "flex", position: "absolute", bottom: 48, fontSize: 22, fontWeight: 700, color: COLORS.primaryTint }}>kondwanimuwowo.com</div>
    </div>
  )
}

export async function renderOgCard(card: OgCard) {
  const [fonts, image] = await Promise.all([loadFonts(), card.image ? toDataUrl(card.image) : null])
  const options = { ...RESPONSE_OPTIONS, fonts: fonts.length > 0 ? fonts : undefined }
  if (!image) return new ImageResponse(centredCard(card), options)

  const textWidth = 560
  const titleSize = card.title.length > 48 ? 52 : card.title.length > 28 ? 60 : 72

  return new ImageResponse(
    (
      <div style={{ width: WIDTH, height: HEIGHT, display: "flex", position: "relative", background: COLORS.white, fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: textWidth + 144, padding: 72 }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: COLORS.ink }}>[&lt;ondwani</div>
          <div style={{ display: "flex", flexDirection: "column", width: textWidth }}>
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, color: COLORS.ink, lineHeight: 1.1, letterSpacing: -1 }}>
              {clip(card.title, 80)}
            </div>
            {card.subtitle && (
              <div style={{ display: "flex", marginTop: 24, fontSize: 26, fontWeight: 500, color: COLORS.muted, lineHeight: 1.4 }}>
                {clip(card.subtitle, 110)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: COLORS.primary }}>kondwanimuwowo.com</span>
            {card.meta && <span style={{ color: COLORS.muted, fontWeight: 500, marginLeft: 16 }}>{card.meta}</span>}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 664,
            top: 96,
            width: 640,
            height: 440,
            display: "flex",
            flexDirection: "column",
            borderRadius: 24,
            overflow: "hidden",
            background: COLORS.white,
            boxShadow: "0 24px 64px rgba(80, 16, 16, 0.28), 0 4px 12px rgba(10, 10, 10, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", height: 36, paddingLeft: 16, background: COLORS.surface }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: COLORS.border, marginRight: 8 }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: COLORS.border, marginRight: 8 }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: COLORS.border }} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} width={640} height={404} style={{ objectFit: "cover", objectPosition: "top" }} alt="" />
        </div>

        <div style={{ position: "absolute", left: 0, bottom: 0, width: WIDTH, height: 12, background: COLORS.primary }} />
      </div>
    ),
    options
  )
}
