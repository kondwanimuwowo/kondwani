import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";

export default defineConfig({
  // Dev only: Material UI icons pull in CommonJS packages that must be pre-bundled,
  // or the browser fails with "does not provide an export named 'default'"
  optimizeDeps: {
    include: ["@mui/icons-material", "@mui/material", "@emotion/react", "@emotion/styled", "prop-types", "react-is", "hoist-non-react-statics"],
  },
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
