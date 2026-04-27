import { describe, expect, it } from "bun:test"
import { pick } from "./fallback"

describe("atoms-v2 fallback workspace", () => {
  it("uses the default demo workspace when no project directory is available", () => {
    expect(pick({ project: undefined, fallback: "D:/github_repo/opencode/test-html" })).toBe(
      "D:/github_repo/opencode/test-html",
    )
  })

  it("keeps an explicit project directory over the demo workspace", () => {
    expect(pick({ project: "C:/work/app", fallback: "D:/github_repo/opencode/test-html" })).toBe("C:/work/app")
  })
})
