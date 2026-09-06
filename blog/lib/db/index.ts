import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "cloudflare:workers"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> }

function createDb() {
  const connectionString = env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  // max: 1, matching Cloudflare Hyperdrive's own documented recommendation
  // for ORMs/pooling clients that aren't Hyperdrive-aware. See lib/db/index.ts
  // (root) for the full explanation, including why this alone doesn't
  // guarantee a fresh connection (verified against pg-pool's source: no
  // health check happens on client checkout regardless of pool size).
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
