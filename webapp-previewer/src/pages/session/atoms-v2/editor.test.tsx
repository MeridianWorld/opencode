import { describe, expect, it } from "bun:test"
import { createAtomsV2Model } from "./state"

describe("atoms-v2 editor semantics", () => {
  it("keeps document content aligned with the active tab after close", () => {
    const ui = createAtomsV2Model()
    ui.setMode("editor")

    ui.setActive("styles.css")
    expect(ui.scene().docs[ui.active()]?.includes("spacing and capsule polish")).toBe(true)

    ui.close("styles.css")
    expect(ui.active()).toBe("SPEC.md")
    expect(ui.scene().docs[ui.active()]?.includes("# EmailFlow spec")).toBe(true)
  })

  it("preserves open tabs while visiting files and inspect modes", () => {
    const ui = createAtomsV2Model()
    ui.setMode("editor")
    ui.open("styles.css")

    const before = ui.tabs().map((item) => item.id)
    ui.setMode("files")
    ui.setMode("inspect")
    ui.setMode("editor")

    expect(ui.tabs().map((item) => item.id)).toEqual(before)
  })
})
