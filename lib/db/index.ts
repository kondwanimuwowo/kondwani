import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "cloudflare:workers"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> }

function createDb() {
  const connectionString = env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  // Tried max: 1 (down from 5) as a proposed fix for intermittent 500s,
  // theorized to make node-postgres reconnect stale connections on checkout.
  // Verified that claim false against pg-pool's own source (_pulseQueue/
  // _acquireClient: no health check on checkout regardless of pool size), and
  // confirmed empirically after deploying it: 8/8 requests failed with max: 1,
  // worse than the ~50% baseline with max: 5. Reverted. The real bug is a
  // crash in vinext's own cacheComponents/queryWithCache response-generation
  // path, unrelated to pool size -- still unresolved.
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    // Bounds how long an individual query can run once connected — unlike
    // connectionTimeoutMillis, which only covers the initial handshake.
    // Without this, a stalled query hangs the request indefinitely, which
    // Workers eventually kills as "your Worker's code had hung".
    query_timeout: 8000,
    statement_timeout: 8000,
  })
  // An unhandled error on an idle pooled connection otherwise hangs the whole
  // isolate instead of surfacing as a catchable query error.
  pool.on("error", (err) => console.error("Postgres pool error", err))
  return drizzle(pool, { schema })
}

// Workers disallow async I/O in global scope, so the real client is built lazily
// on first use (inside a request) instead of at module load time.
function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = createDb()
  }
  return globalForDb.db
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

export * from "./schema"
