import { describe, expect, it } from "bun:test"
import { demo, demoRoute, isDemo } from "./fallback"
import { demoWorkspace } from "./demo-workspace"

describe("atoms-v2 fallback workspace", () => {
  it("uses a stable demo workspace for hosted entry", () => {
    expect(demo()).toBe("Demo workspace")
    expect(isDemo("Demo workspace")).toBe(true)
    expect(demoRoute()).toContain("/session/demo")
  })

  it("does not treat normal project directories as demo workspace", () => {
    expect(isDemo("C:/work/app")).toBe(false)
  })

  it("ships virtual files with an html preview", () => {
    expect(demoWorkspace.initial).toBe("index.html")
    expect(demoWorkspace.docs["index.html"]).toContain("EmailFlow")
    expect(demoWorkspace.preview?.html).toContain("EmailFlow")
  })
})
