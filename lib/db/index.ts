import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "cloudflare:workers"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> }

function createDb() {
  const connectionString = env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  // max: 1, matching Cloudflare Hyperdrive's own documented recommendation for
  // ORMs/pooling clients that aren't Hyperdrive-aware: Hyperdrive already pools
  // connections to Postgres upstream, so a multi-slot client-side pool is
  // redundant complexity, not a fix for connection staleness. Verified against
  // pg-pool's own source (_pulseQueue/_acquireClient): there is no health
  // check or reconnect when an idle client is checked out via pool.connect() —
  // a stale connection is handed back as-is, whether max is 1 or 5. So max: 1
  // does not, by itself, guarantee a fresh connection; it only means a single
  // isolate can go stale in one failure mode (100% of its requests) instead of
  // a fraction of a larger pool's slots. Kept per Hyperdrive's guidance and
  // because it removes unneeded complexity, but the actual reliability floor
  // is the query_timeout/statement_timeout below (bounds a stuck query to a
  // fast, catchable failure) plus retrying at the call site -- not this
  // pool-size change alone.
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
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
