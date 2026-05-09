import { describe, expect, it } from "bun:test"
import { demoWorkspace } from "./demo-workspace"
import { api, fetchDemoWorkspace, payload } from "./demo-api"

describe("atoms-v2 Vercel demo API", () => {
  it("exposes the demo workspace payload for the Vercel function", () => {
    expect(api).toBe("/api/demo/workspace")
    expect(payload()).toEqual({
      source: "vercel-demo-api",
      workspace: demoWorkspace,
    })
  })

  it("loads the demo workspace through a fetch-compatible backend URL", async () => {
    const data = await fetchDemoWorkspace(async (url) => {
      expect(url).toBe(api)
      return new Response(JSON.stringify(payload()), { status: 200 })
    })

    expect(data).toEqual(demoWorkspace)
  })
})
