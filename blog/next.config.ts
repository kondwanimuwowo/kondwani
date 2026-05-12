import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "assets.kondwanimuwowo.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
}

export default nextConfig
