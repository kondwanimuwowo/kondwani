import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"
import type { BrainSource } from "@prisma/client"
import type { Connector, ConnectorResult, RawDoc } from "../types"

interface NotionCursor {
  lastEditedAt?: string
}

/**
 * Pulls every page the integration has been shared with (including database
 * rows, which Notion also models as pages). Incremental: search results are
 * ordered by last_edited_time desc, so we stop paging once we reach the
 * watermark from the previous sync.
 */
export const notionConnector: Connector = {
  provider: "notion",
  displayName: "Notion",
  cloudSafe: true,

  async sync(source: BrainSource): Promise<ConnectorResult> {
    const token = process.env.NOTION_TOKEN
    if (!token) throw new Error("NOTION_TOKEN is not set — see BRAIN-SETUP.md")

    const notion = new Client({ auth: token })
    const n2m = new NotionToMarkdown({ notionClient: notion })
    const cursor = (source.cursor ?? {}) as NotionCursor
    const watermark = cursor.lastEditedAt ? new Date(cursor.lastEditedAt) : null

    const docs: RawDoc[] = []
    const removedExternalIds: string[] = []
    let newestEdit = watermark
    let startCursor: string | undefined
    let done = false

    while (!done) {
      const res = await notion.search({
        filter: { property: "object", value: "page" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        start_cursor: startCursor,
        page_size: 50,
      })

      for (const item of res.results) {
        if (item.object !== "page" || !("last_edited_time" in item)) continue
        const page = item
        const editedAt = new Date(page.last_edited_time)
        if (watermark && editedAt <= watermark) {
          done = true
          break
        }
        if (!newestEdit || editedAt > newestEdit) newestEdit = editedAt

        if ("archived" in page && page.archived) {
          removedExternalIds.push(page.id)
          continue
        }

        const title = pageTitle(page)
        const mdBlocks = await n2m.pageToMarkdown(page.id)
        const markdown = n2m.toMarkdownString(mdBlocks).parent ?? ""
        const propsText = pagePropertiesText(page)

        docs.push({
          externalId: page.id,
          title,
          kind: "note",
          mimeType: "text/markdown",
          sourceUrl: "url" in page ? (page.url as string) : undefined,
          path: parentLabel(page),
          content: [propsText, markdown].filter(Boolean).join("\n\n"),
          sourceModifiedAt: editedAt,
          metadata: { notionParent: "parent" in page ? page.parent : undefined },
        })
      }

      if (!done && res.has_more && res.next_cursor) {
        startCursor = res.next_cursor
      } else {
        done = true
      }
    }

    return {
      docs,
      removedExternalIds,
      cursor: { lastEditedAt: (newestEdit ?? new Date()).toISOString() },
    }
  },
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function pageTitle(page: any): string {
  const props = page.properties ?? {}
  for (const value of Object.values<any>(props)) {
    if (value?.type === "title" && Array.isArray(value.title)) {
      const text = value.title.map((t: any) => t.plain_text).join("")
      if (text) return text
    }
  }
  return "Untitled"
}

/** Database-row pages carry their data in properties — flatten them to text. */
function pagePropertiesText(page: any): string {
  const props = page.properties ?? {}
  const lines: string[] = []
  for (const [name, value] of Object.entries<any>(props)) {
    if (value?.type === "title") continue
    const text = propertyToText(value)
    if (text) lines.push(`- **${name}**: ${text}`)
  }
  return lines.join("\n")
}

function propertyToText(value: any): string {
  switch (value?.type) {
    case "rich_text":
      return value.rich_text.map((t: any) => t.plain_text).join("")
    case "select":
      return value.select?.name ?? ""
    case "multi_select":
      return value.multi_select.map((s: any) => s.name).join(", ")
    case "status":
      return value.status?.name ?? ""
    case "date":
      return value.date ? [value.date.start, value.date.end].filter(Boolean).join(" → ") : ""
    case "number":
      return value.number != null ? String(value.number) : ""
    case "checkbox":
      return value.checkbox ? "yes" : "no"
    case "url":
      return value.url ?? ""
    case "email":
      return value.email ?? ""
    case "phone_number":
      return value.phone_number ?? ""
    case "people":
      return value.people.map((p: any) => p.name).filter(Boolean).join(", ")
    default:
      return ""
  }
}

function parentLabel(page: any): string | undefined {
  const parent = page.parent
  if (!parent) return undefined
  if (parent.type === "database_id") return "Notion database row"
  if (parent.type === "workspace") return "Workspace"
  return undefined
}
