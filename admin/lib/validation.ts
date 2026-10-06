import { NextResponse } from "next/server"
import { z } from "zod"

type Parsed<T> = { data: T; error?: never } | { data?: never; error: NextResponse }

// Parses a JSON body against a schema, or returns a 400 naming the first bad field.
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<Parsed<z.infer<S>>> {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = issue.path.join(".")
    return { error: NextResponse.json({ error: field ? `${field}: ${issue.message}` : issue.message }, { status: 400 }) }
  }
  return { data: result.data }
}

export const lineItems = z.array(z.object({
  description: z.string(),
  quantity: z.coerce.number(),
  rate: z.coerce.number(),
  flat: z.boolean().optional(),
  position: z.coerce.number().int().optional(),
}))
