import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "cloudflare:workers"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> }

function createDb() {
  const connectionString = env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
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
