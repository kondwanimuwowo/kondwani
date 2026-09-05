// CLI sync runner: npm run brain:sync [-- <source>]
//   npm run brain:sync              → all sources (incl. local inbox)
//   npm run brain:sync -- local     → just the drop folder
//   npm run brain:sync -- notion    → just Notion
import "dotenv/config"
import { connectors } from "@/lib/brain/connectors"
import { organizeInbox } from "@/lib/brain/connectors/local"
import { runSync } from "@/lib/brain/sync"

const requested = process.argv[2]

async function main() {
  const targets = Object.values(connectors).filter((c) => !requested || c.provider === requested)
  if (targets.length === 0) {
    console.error(`Unknown source "${requested}". Options: ${Object.keys(connectors).join(", ")}`)
    process.exit(1)
  }

  let failed = false
  for (const connector of targets) {
    process.stdout.write(`Syncing ${connector.displayName}... `)
    try {
      const summary = await runSync(connector)
      console.log(
        `done — ${summary.added} added, ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.removed} removed`
      )
      if (connector.provider === "local") {
        const moved = await organizeInbox(summary)
        for (const line of moved) console.log(`  filed: ${line}`)
      }
    } catch (err) {
      failed = true
      console.error(`FAILED — ${err instanceof Error ? err.message : err}`)
    }
  }
  process.exit(failed ? 1 : 0)
}

main()
