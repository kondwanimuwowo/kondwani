import { S3Client } from "@aws-sdk/client-s3"
import { env } from "cloudflare:workers"

let _r2: S3Client | undefined

// Lazy, like lib/db/index.ts: process.env isn't populated until inside a
// request in this Workers setup, so building the client at module load time
// bakes in `undefined` for the account id (breaking the endpoint hostname).
function getR2() {
  if (!_r2) {
    const accountId = env.R2_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _r2
}

export const r2 = new Proxy({} as S3Client, {
  get(_target, prop, receiver) {
    return Reflect.get(getR2(), prop, receiver)
  },
})

export function getR2Bucket() {
  return env.R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME ?? "kondwanimuwowo"
}

export function getR2PublicUrl() {
  return process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://assets.kondwanimuwowo.com"
}
