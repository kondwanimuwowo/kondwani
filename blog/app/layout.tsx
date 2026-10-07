import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import "./globals.css"
import { MAIN_SITE } from "@/lib/site"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const description = "Notes on web development, design and building websites and web systems for businesses in Zambia, by Kondwani Muwowo."
const card = [{ url: `${MAIN_SITE}/images/og/blog.png`, width: 1200, height: 630, alt: "Blog by Kondwani Muwowo" }]

export const metadata: Metadata = {
  metadataBase: new URL("https://blog.kondwanimuwowo.com"),
  title: { default: "Blog, Kondwani Muwowo", template: "%s, Kondwani Muwowo" },
  description,
  alternates: { canonical: `${MAIN_SITE}/blog` },
  openGraph: { type: "website", siteName: "Kondwani Muwowo", title: "Blog, Kondwani Muwowo", description, url: `${MAIN_SITE}/blog`, images: card },
  twitter: { card: "summary_large_image", creator: "@kondwanimuwow0", site: "@kondwanimuwow0", images: card },
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
