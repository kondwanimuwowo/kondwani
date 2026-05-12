import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "kondwanimuwowo.github.io" },
      { protocol: "https", hostname: "greatachieversnetwork.org" },
      { protocol: "https", hostname: "smilefxtraders.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "assets.kondwanimuwowo.com" },
    ],
  },
}

export default nextConfig
