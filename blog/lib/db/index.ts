import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { env } from "cloudflare:workers"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { db?: NodePgDatabase<typeof schema> }

function createDb() {
  const connectionString = env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  const pool = new Pool({ connectionString })
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
