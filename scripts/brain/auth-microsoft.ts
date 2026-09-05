// One-time Microsoft sign-in via device-code flow (no redirect URL needed):
//   npm run brain:auth:ms
// Stores the refresh token on the BrainSource row; syncs renew it silently.
import "dotenv/config"
import { db, brainSource } from "@/lib/db"
import { eq } from "drizzle-orm"
import { microsoftConnector, MS_SCOPES } from "@/lib/brain/connectors/microsoft"
import { getOrCreateSource } from "@/lib/brain/sync"

const AUTH_BASE = "https://login.microsoftonline.com/consumers/oauth2/v2.0"

async function main() {
  const clientId = process.env.MS_CLIENT_ID
  if (!clientId) {
    console.error("MS_CLIENT_ID is not set. Create an Azure app registration first — see BRAIN-SETUP.md")
    process.exit(1)
  }

  const deviceRes = await fetch(`${AUTH_BASE}/devicecode`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, scope: MS_SCOPES }),
  })
  if (!deviceRes.ok) throw new Error(`devicecode failed (${deviceRes.status}): ${await deviceRes.text()}`)
  const device = (await deviceRes.json()) as {
    device_code: string
    user_code: string
    verification_uri: string
    interval: number
    expires_in: number
    message: string
  }

  console.log("\n" + device.message + "\n")

  const deadline = Date.now() + device.expires_in * 1000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, (device.interval || 5) * 1000))
    const tokenRes = await fetch(`${AUTH_BASE}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: device.device_code,
      }),
    })
    const data = (await tokenRes.json()) as {
      error?: string
      refresh_token?: string
      access_token?: string
    }
    if (data.error === "authorization_pending") continue
    if (data.error) throw new Error(`token exchange failed: ${data.error}`)
    if (!data.refresh_token) throw new Error("no refresh_token returned — is the app a public client with offline_access?")

    const source = await getOrCreateSource(microsoftConnector)
    await db.update(brainSource).set({
      credentials: { refreshToken: data.refresh_token },
      status: "connected",
      lastError: null,
    }).where(eq(brainSource.id, source.id))
    console.log("Microsoft account connected. Run: npm run brain:sync -- microsoft")
    process.exit(0)
  }
  throw new Error("Sign-in timed out — run the script again.")
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
