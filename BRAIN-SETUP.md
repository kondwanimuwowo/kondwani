# Second Brain — Setup & Usage

Your second brain pulls everything from **Notion, OneNote, OneDrive, Excel, Google Drive, and local files** into the Supabase database, where it is AI-summarized, tagged, categorized, chunked, and embedded (pgvector) for semantic search and question-answering.

## Architecture

```
Notion ─────────┐
OneNote ────────┤   connector    ┌─ enrich (Claude: summary/tags/category)
OneDrive/Excel ─┼──────────────► │  chunk  (~800 tokens, paragraph-aware)
Google Drive ───┤   normalize    │  embed  (text-embedding-3-small, 1536d)
brain-inbox/ ───┘                └─ upsert → BrainDocument + BrainChunk (pgvector)
```

- **Incremental**: every source keeps a sync cursor (Notion edit watermark, Graph delta links, Drive changes token). Unchanged content is skipped via content hashing — no re-embedding, no wasted AI calls.
- **Secure**: all `Brain*` tables have RLS enabled with no policies, so nothing leaks through Supabase's public REST API. Sync/search/ask routes require `Authorization: Bearer $CRON_SECRET`.
- **Scheduled**: Vercel Cron hits `/api/brain/sync` every 6 hours (see `vercel.json`).

## 1. AI Gateway key (required first)

Embeddings and enrichment run through the Vercel AI Gateway.

1. Vercel dashboard → **AI Gateway** → create an API key.
2. Set `AI_GATEWAY_API_KEY` in `.env` (uncomment the placeholder) and in Vercel → Project → Settings → Environment Variables.

## 2. Notion (easiest — do this one first)

1. Go to <https://www.notion.so/my-integrations> → **New integration** (internal).
2. Copy the secret → set `NOTION_TOKEN` in `.env` + Vercel.
3. In Notion, open each top-level page/database you want indexed → `···` menu → **Connections** → add your integration. (Children are included automatically.)
4. Test: `npm run brain:sync -- notion`

## 3. Microsoft — OneNote, OneDrive, Excel (one Azure app covers all)

1. <https://portal.azure.com> → **Microsoft Entra ID** → **App registrations** → **New registration**:
   - Name: `second-brain`
   - Supported account types: **Personal Microsoft accounts only**
   - No redirect URI needed.
2. In the app → **Authentication** → enable **Allow public client flows** (this powers the device-code sign-in).
3. Copy the **Application (client) ID** → set `MS_CLIENT_ID` in `.env` + Vercel.
4. Sign in once: `npm run brain:auth:ms` — it prints a code and a URL; approve in the browser. The refresh token is stored in the DB and renews itself on every sync.
5. Test: `npm run brain:sync -- microsoft`

Excel files (`.xlsx`) on OneDrive are parsed sheet-by-sheet into searchable tables automatically.

## 4. Google Drive

1. <https://console.cloud.google.com> → create a project (e.g. `second-brain`).
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **OAuth consent screen** → External → add yourself as a test user.
4. **Credentials → Create credentials → OAuth client ID** → type **Desktop app**.
5. Copy client ID + secret → set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env` + Vercel.
6. Sign in once: `npm run brain:auth:google` — open the printed URL, approve; the loopback server catches the redirect.
7. Test: `npm run brain:sync -- google`

Google Docs/Sheets/Slides are exported to text/CSV; PDFs, Word, and Excel files are downloaded and parsed.

## 5. Local drop folder

Drop any file into `brain-inbox/` (created automatically, gitignored), then:

```
npm run brain:sync -- local
```

Each file is ingested, categorized by Claude, and **filed into `brain-vault/<category>/`** (work, projects, finance, career, learning, ideas, personal, health, travel, reference, admin). Duplicate drops are no-ops (content-hash dedupe).

Supported: `pdf docx xlsx html md txt csv json yaml xml tex log`

## Daily usage

```bash
npm run brain:sync                 # sync everything, incl. the inbox
npm run brain:sync -- notion       # one source
```

Semantic search:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://your-site.com/api/brain/search?q=hosting+budget&limit=10"
```

Ask your second brain a question (RAG over your own data, with citations):

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" \
  -d '{"question":"What did I plan for the Lenco integration?"}' \
  https://your-site.com/api/brain/ask
```

In production, the cron job keeps Notion/Microsoft/Google fresh every 6 hours on its own — only the local inbox needs a manual `brain:sync` since it reads your filesystem.

## Env var summary

| Variable | Where used | Source |
|---|---|---|
| `AI_GATEWAY_API_KEY` | embeddings, enrichment, /ask | Vercel AI Gateway |
| `NOTION_TOKEN` | Notion connector | notion.so/my-integrations |
| `MS_CLIENT_ID` | Microsoft connector + auth | Azure app registration |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google connector + auth | Google Cloud OAuth desktop client |
| `CRON_SECRET` | API route auth (already set) | existing |

OAuth refresh tokens live in the `BrainSource.credentials` column (RLS-protected), never in git.
