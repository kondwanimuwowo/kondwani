// One-time DB setup for the second brain: pgvector extension, ANN index, RLS lockdown.
// Run AFTER `drizzle-kit push`: node scripts/brain/setup-db.mjs
// (the extension step also runs safely before push — the script is idempotent)
import "dotenv/config";
import pg from "pg";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL / DIRECT_URL not set");

const client = new pg.Client({ connectionString: url });
await client.connect();

const statements = [
  `CREATE EXTENSION IF NOT EXISTS vector`,
  // HNSW index for cosine similarity search over chunk embeddings
  `CREATE INDEX IF NOT EXISTS brain_chunk_embedding_idx
     ON "BrainChunk" USING hnsw (embedding vector_cosine_ops)`,
  // Personal knowledge + OAuth tokens must never leak through Supabase's public
  // REST API (anon key). The app connects as table owner and bypasses RLS, so
  // enabling RLS with no policies simply denies anon/authenticated access.
  `ALTER TABLE "BrainSource" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "BrainDocument" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "BrainChunk" ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE "BrainSyncRun" ENABLE ROW LEVEL SECURITY`,
];

for (const sql of statements) {
  try {
    await client.query(sql);
    console.log("ok:", sql.split("\n")[0].trim());
  } catch (err) {
    // Index/RLS statements fail harmlessly if tables don't exist yet (pre-push)
    console.warn("skipped:", sql.split("\n")[0].trim(), "—", err.message);
  }
}

await client.end();
console.log("done");
