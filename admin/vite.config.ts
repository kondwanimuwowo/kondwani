import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// The KV-backed data cache adapter was implicated in intermittent 500s on
// mutation routes (crashes inside vinext's own cacheComponents/
// queryWithCache internals) -- admin is mutation-heavy and doesn't
// benefit much from cached reads, so drop the adapter and let vinext
// fall back to its uncached default instead of routing through KV.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
