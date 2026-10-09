import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "cloudflare:workers"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> }

function createDb() {
  // LOCAL_DATABASE_URL only exists in .dev.vars: Wrangler's local Hyperdrive stand-in rebuilds the URL
  // without re-encoding special characters in the password, so local dev connects directly instead
  const connectionString = process.env.LOCAL_DATABASE_URL ?? env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  // Workers can't reuse a socket opened during another request: the query
  // stalls until query_timeout. The pool outlives requests (cached on
  // globalThis), so an idle connection handed to the next request made every
  // other request 500 after ~8s. maxUses: 1 closes each connection on release
  // so none survive their request; Hyperdrive does the real pooling.
  const pool = new Pool({
    connectionString,
    max: 5,
    maxUses: 1,
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
