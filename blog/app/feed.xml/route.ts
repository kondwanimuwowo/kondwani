import { categoryLabel } from "@/data/blogCategories"
import { canonicalUrl, getPosts } from "@/lib/posts"
import { BLOG_SITE } from "@/lib/site"

function escape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// RSS feed of every post, so readers can follow the blog in a feed reader
export async function GET() {
  const posts = await getPosts()
  const items = posts
    .map((p) => {
      const url = canonicalUrl(p)
      return [
        "    <item>",
        `      <title>${escape(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escape(p.excerpt)}</description>`,
        `      <category>${escape(categoryLabel(p.category))}</category>`,
        p.publishedAt ? `      <pubDate>${p.publishedAt.toUTCString()}</pubDate>` : "",
        "    </item>",
      ].filter(Boolean).join("\n")
    })
    .join("\n")

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>Kondwani Muwowo</title>",
    `    <link>${BLOG_SITE}</link>`,
    "    <description>Writing on code, faith, chess, the gym, hiking and everyday life.</description>",
    "    <language>en-gb</language>",
    `    <atom:link href="${BLOG_SITE}/feed.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n")

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=3600" },
  })
}
