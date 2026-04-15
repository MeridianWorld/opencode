import { describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { createAtomsState } from "./state"

describe("createAtomsState", () => {
  test("defaults to preview and can switch the side view", () => {
    createRoot((dispose) => {
      const atoms = createAtomsState()
      expect(atoms.view()).toBe("preview")
      atoms.setView("files")
      expect(atoms.view()).toBe("files")
      dispose()
    })
  })

  test("toggles rail and side visibility", () => {
    createRoot((dispose) => {
      const atoms = createAtomsState()
      expect(atoms.rail()).toBe(true)
      expect(atoms.side()).toBe(true)
      atoms.toggleRail()
      atoms.toggleSide()
      expect(atoms.rail()).toBe(false)
      expect(atoms.side()).toBe(false)
      dispose()
    })
  })
})
