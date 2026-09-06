import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";

// Note: intermittent 500s on mutation routes (crashes inside vinext's own
// cacheComponents/queryWithCache internals, file db-*.js) were confirmed via
// A/B test to happen identically with or without this adapter configured --
// it's baked into vinext@1.0.0-beta.9's request dispatch, not caused by our
// cache config. Restored since removing it had no effect and only cost us
// caching. See ProjectForm.tsx's fetchWithRetry for the actual mitigation.
export default defineConfig({
  plugins: [
    vinext({
      cache: { data: kvDataAdapter(), cdn: cdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
