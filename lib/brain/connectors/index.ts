import type { Connector } from "../types"
import { googleConnector } from "./google"
import { localConnector } from "./local"
import { microsoftConnector } from "./microsoft"
import { notionConnector } from "./notion"

export const connectors: Record<string, Connector> = {
  notion: notionConnector,
  microsoft: microsoftConnector,
  google: googleConnector,
  local: localConnector,
}

export { googleConnector, localConnector, microsoftConnector, notionConnector }
