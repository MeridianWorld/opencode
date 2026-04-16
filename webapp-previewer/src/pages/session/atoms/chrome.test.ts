import { describe, expect, test } from "bun:test"
import { badge, hint, pill, stage } from "./chrome"

describe("atoms chrome", () => {
  test("keeps note badges and pills on a shared atoms visual language", () => {
    expect(badge()).toContain("rounded-full")
    expect(hint()).toContain("bg-[var(--atoms-card-muted)]")
    expect(pill(true)).toContain("border-[var(--atoms-accent)]")
    expect(pill(false)).toContain("text-[var(--atoms-soft)]")
  })

  test("lets the stage keep horizontal overflow visible for official session content", () => {
    expect(stage()).toContain("overflow-x-visible")
    expect(stage()).toContain("overflow-y-hidden")
  })
})
