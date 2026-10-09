import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import "./globals.css"
import { BLOG_SITE, MAIN_SITE, TWITTER } from "@/lib/site"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const description = "Writing on code, faith, chess, the gym, hiking and everyday life, by Kondwani Muwowo."
const card = [{ url: `${MAIN_SITE}/images/og/blog.png`, width: 1200, height: 630, alt: "Blog by Kondwani Muwowo" }]

export const metadata: Metadata = {
  metadataBase: new URL(BLOG_SITE),
  title: { default: "Blog, Kondwani Muwowo", template: "%s, Kondwani Muwowo" },
  description,
  authors: [{ name: "Kondwani Muwowo", url: MAIN_SITE }],
  alternates: { types: { "application/rss+xml": `${BLOG_SITE}/feed.xml` } },
  openGraph: { type: "website", siteName: "Kondwani Muwowo", locale: "en_GB", title: "Blog, Kondwani Muwowo", description, url: BLOG_SITE, images: card },
  twitter: { card: "summary_large_image", creator: TWITTER, site: TWITTER, images: card },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ScrollToTop />
      </body>
    </html>
  )
}
