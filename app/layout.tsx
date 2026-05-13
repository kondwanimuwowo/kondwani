import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://kondwanimuwowo.com"),
  title: {
    default: "Kondwani Muwowo | Software Developer & UI Designer",
    template: "%s | Kondwani Muwowo",
  },
  description:
    "Software Developer and UI Designer based in Lusaka, Zambia. Building clean, thoughtful, and smooth digital experiences.",
  keywords: ["Software Developer", "UI Designer", "React", "Next.js", "Zambia", "Kondwani Muwowo"],
  authors: [{ name: "Kondwani Muwowo" }],
  creator: "Kondwani Muwowo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kondwanimuwowo.com",
    siteName: "Kondwani Muwowo",
    title: "Kondwani Muwowo | Software Developer & UI Designer",
    description:
      "Software Developer and UI Designer based in Lusaka, Zambia. Building clean, thoughtful, and smooth digital experiences.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kondwani Muwowo | Software Developer & UI Designer",
    description: "Software Developer and UI Designer based in Lusaka, Zambia.",
    creator: "@kondwanimuwow0",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
