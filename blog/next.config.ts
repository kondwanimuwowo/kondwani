import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "assets.kondwanimuwowo.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
  // The CMS moved to the admin hub.
  async redirects() {
    return [
      { source: "/cms", destination: "https://hub.kondwanimuwowo.com/blog", permanent: true },
      { source: "/cms/:path*", destination: "https://hub.kondwanimuwowo.com/blog", permanent: true },
      { source: "/login", destination: "https://hub.kondwanimuwowo.com/login", permanent: true },
    ]
  },
}

export default nextConfig
