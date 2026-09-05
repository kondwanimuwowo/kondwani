import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { env } from "cloudflare:workers"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const connectionString = env.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

// Workers disallow async I/O in global scope, so the real client is built lazily
// on first use (inside a request) instead of at module load time.
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver)
  },
})
