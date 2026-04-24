import { describe, expect, it } from "bun:test"
import { createAtomsV2Model } from "./state"

describe("createAtomsV2Model", () => {
  it("switches between viewer and editor scenes", () => {
    const ui = createAtomsV2Model()

    expect(ui.mode()).toBe("viewer")
    expect(ui.scene().id).toBe("viewer-reference")

    ui.setMode("editor")

    expect(ui.mode()).toBe("editor")
    expect(ui.scene().id).toBe("editor-reference")
    expect(ui.step()).toBe("editor")
  })

  it("closes the active tab and keeps a neighbor active", () => {
    const ui = createAtomsV2Model()

    ui.setMode("editor")
    ui.setActive("styles.css")
    ui.close("styles.css")

    expect(ui.tabs().some((item) => item.id === "styles.css")).toBe(false)
    expect(ui.active()).toBe("SPEC.md")
  })

  it("opens a file from the editor fixtures", () => {
    const ui = createAtomsV2Model()

    ui.setMode("editor")
    ui.close("SPEC.md")
    ui.open("SPEC.md")

    expect(ui.tabs().some((item) => item.id === "SPEC.md")).toBe(true)
    expect(ui.active()).toBe("SPEC.md")
  })
})
