import { convert as htmlToText } from "html-to-text"

export interface Extracted {
  content: string
  kind: string
}

const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "json", "log", "yaml", "yml", "xml", "tex"])
const MAX_SHEET_ROWS = 500

export function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

export function isSupportedFile(name: string): boolean {
  const ext = extensionOf(name)
  return TEXT_EXTENSIONS.has(ext) || ["pdf", "docx", "xlsx", "html", "htm"].includes(ext)
}

/** Turn a file buffer into plain text/markdown based on its extension. */
export async function extractFromBuffer(buffer: Buffer, filename: string): Promise<Extracted> {
  const ext = extensionOf(filename)

  if (TEXT_EXTENSIONS.has(ext)) {
    return { content: buffer.toString("utf-8"), kind: ext === "md" || ext === "markdown" ? "note" : "text" }
  }

  if (ext === "html" || ext === "htm") {
    return { content: htmlToPlainText(buffer.toString("utf-8")), kind: "document" }
  }

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    try {
      const result = await parser.getText()
      return { content: result.text, kind: "pdf" }
    } finally {
      await parser.destroy()
    }
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return { content: result.value, kind: "document" }
  }

  if (ext === "xlsx") {
    return { content: await extractXlsx(buffer), kind: "spreadsheet" }
  }

  throw new Error(`Unsupported file type: .${ext} (${filename})`)
}

export function htmlToPlainText(html: string): string {
  return htmlToText(html, {
    wordwrap: false,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  })
}

/** Render each worksheet as a markdown-ish table so rows stay semantically grouped. */
async function extractXlsx(buffer: Buffer): Promise<string> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

  const sections: string[] = []
  workbook.eachSheet((sheet) => {
    const rows: string[] = []
    let count = 0
    sheet.eachRow({ includeEmpty: false }, (row) => {
      if (count >= MAX_SHEET_ROWS) return
      const values = (row.values as unknown[])
        .slice(1) // exceljs row values are 1-indexed
        .map((v) => formatCell(v))
      if (values.some((v) => v !== "")) {
        rows.push("| " + values.join(" | ") + " |")
        count++
      }
    })
    if (rows.length > 0) {
      sections.push(`## Sheet: ${sheet.name}\n\n${rows.join("\n")}`)
    }
  })
  return sections.join("\n\n")
}

function formatCell(v: unknown): string {
  if (v == null) return ""
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[]; hyperlink?: string }
    if (o.richText) return o.richText.map((r) => r.text).join("")
    if (o.text) return o.text
    if (o.result != null) return String(o.result)
    return ""
  }
  return String(v).replace(/\|/g, "\\|").replace(/\n/g, " ")
}
