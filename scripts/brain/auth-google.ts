// One-time Google sign-in via loopback OAuth:
//   npm run brain:auth:google
// Opens a consent URL; a temporary localhost server catches the redirect.
// Stores the refresh token on the BrainSource row.
import "dotenv/config"
import { createServer } from "node:http"
import { prisma } from "@/lib/prisma"
import { googleConnector, GOOGLE_SCOPES } from "@/lib/brain/connectors/google"
import { getOrCreateSource } from "@/lib/brain/sync"

const PORT = 53682
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — see BRAIN-SETUP.md")
    process.exit(1)
  }

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: GOOGLE_SCOPES,
      access_type: "offline",
      prompt: "consent", // force a refresh_token even on re-consent
    })

  console.log("\nOpen this URL in your browser and approve access:\n\n" + authUrl + "\n")

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI)
      if (url.pathname !== "/callback") {
        res.writeHead(404).end()
        return
      }
      const err = url.searchParams.get("error")
      const code = url.searchParams.get("code")
      res.writeHead(200, { "Content-Type": "text/html" })
      res.end(err ? `<h3>Failed: ${err}</h3>` : "<h3>Connected — you can close this tab.</h3>")
      server.close()
      if (err || !code) reject(new Error(err ?? "no code returned"))
      else resolve(code)
    })
    server.listen(PORT)
    setTimeout(() => {
      server.close()
      reject(new Error("Sign-in timed out — run the script again."))
    }, 5 * 60 * 1000).unref()
  })

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  })
  if (!tokenRes.ok) throw new Error(`token exchange failed (${tokenRes.status}): ${await tokenRes.text()}`)
  const data = (await tokenRes.json()) as { refresh_token?: string }
  if (!data.refresh_token) throw new Error("no refresh_token returned — remove the app's prior grant and retry")

  const source = await getOrCreateSource(googleConnector)
  await prisma.brainSource.update({
    where: { id: source.id },
    data: { credentials: { refreshToken: data.refresh_token }, status: "connected", lastError: null },
  })
  console.log("Google account connected. Run: npm run brain:sync -- google")
  process.exit(0)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
