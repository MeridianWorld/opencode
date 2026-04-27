import { describe, expect, it } from "bun:test"
import { createAtomsV2Model } from "./state"
import type { WorkspaceData } from "./workspace"

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

  it("opens a file from the backend workspace source", () => {
    const loaded: string[] = []
    const data: WorkspaceData = {
      tree: [{ id: "index.html", label: "index.html", kind: "file", depth: 0 }],
      docs: {},
      initial: "index.html",
      preview: undefined,
    }
    const ui = createAtomsV2Model({
      data: () => data,
      load: (path) => loaded.push(path),
      toggle: () => {},
    })

    ui.open("index.html")

    expect(loaded).toEqual(["index.html"])
    expect(ui.tabs()).toEqual([{ id: "index.html", label: "index.html" }])
    expect(ui.active()).toBe("index.html")
  })
})
