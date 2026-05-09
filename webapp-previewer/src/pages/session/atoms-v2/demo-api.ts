import { demoWorkspace } from "./demo-workspace.js"
import type { WorkspaceData } from "./workspace"

export const api = "/api/demo/workspace"

export type DemoPayload = {
  source: "vercel-demo-api"
  workspace: WorkspaceData
}

type Fetcher = (url: string) => Promise<Response>

export function payload(): DemoPayload {
  return {
    source: "vercel-demo-api",
    workspace: demoWorkspace,
  }
}

function valid(input: unknown): input is DemoPayload {
  if (!input || typeof input !== "object") return false
  return "workspace" in input
}

export function parse(input: unknown) {
  if (valid(input)) return input.workspace
  return demoWorkspace
}

export async function fetchDemoWorkspace(fetcher: Fetcher = fetch) {
  const res = await fetcher(api)
  if (!res.ok) throw new Error(`Demo backend returned ${res.status}`)
  return parse(await res.json())
}
