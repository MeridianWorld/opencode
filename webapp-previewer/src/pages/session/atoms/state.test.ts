import { describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { createAtomsState } from "./state"

describe("createAtomsState", () => {
  test("defaults to preview mode and manages file tabs", () => {
    createRoot((dispose) => {
      const atoms = createAtomsState()
      expect(atoms.mode()).toBe("preview")
      expect(atoms.fileTabs()).toEqual([])
      expect(atoms.activeFile()).toBe(null)

      atoms.openFile("src/main.ts")
      expect(atoms.fileTabs()).toEqual(["src/main.ts"])
      expect(atoms.activeFile()).toBe("src/main.ts")
      expect(atoms.mode()).toBe("editor")

      atoms.openFile("src/main.ts")
      expect(atoms.fileTabs()).toEqual(["src/main.ts"])

      atoms.openFile("src/app.ts")
      atoms.openFile("src/util.ts")
      expect(atoms.fileTabs()).toEqual(["src/main.ts", "src/app.ts", "src/util.ts"])
      expect(atoms.activeFile()).toBe("src/util.ts")

      atoms.activateFile("src/app.ts")
      expect(atoms.activeFile()).toBe("src/app.ts")

      atoms.closeFile("src/main.ts")
      expect(atoms.fileTabs()).toEqual(["src/app.ts", "src/util.ts"])
      expect(atoms.activeFile()).toBe("src/app.ts")

      atoms.closeFile("src/app.ts")
      expect(atoms.fileTabs()).toEqual(["src/util.ts"])
      expect(atoms.activeFile()).toBe("src/util.ts")

      atoms.closeFile("src/util.ts")
      expect(atoms.fileTabs()).toEqual([])
      expect(atoms.activeFile()).toBe(null)
      dispose()
    })
  })

  test("toggles rail, side, and mode", () => {
    createRoot((dispose) => {
      const atoms = createAtomsState()
      expect(atoms.rail()).toBe(true)
      expect(atoms.side()).toBe(true)
      expect(atoms.mode()).toBe("preview")
      atoms.setMode("files")
      atoms.toggleRail()
      atoms.toggleSide()
      expect(atoms.mode()).toBe("files")
      expect(atoms.rail()).toBe(false)
      expect(atoms.side()).toBe(false)
      dispose()
    })
  })

  test("syncs file state from external session tabs", () => {
    createRoot((dispose) => {
      const atoms = createAtomsState()

      atoms.openFile("src/main.ts")
      atoms.syncFiles(["alpha.ts", "beta.ts"], "beta.ts")
      expect(atoms.fileTabs()).toEqual(["alpha.ts", "beta.ts"])
      expect(atoms.activeFile()).toBe("beta.ts")

      atoms.syncFiles([], undefined)
      expect(atoms.fileTabs()).toEqual([])
      expect(atoms.activeFile()).toBe(null)
      dispose()
    })
  })
})
