import { createSignal } from "solid-js"

export type AtomsView = "preview" | "editor" | "files" | "inspect"

export function createAtomsState() {
  const [view, setView] = createSignal<AtomsView>("preview")
  const [rail, setRail] = createSignal(true)
  const [side, setSide] = createSignal(true)

  return {
    view,
    rail,
    side,
    setView,
    toggleRail: () => setRail((value) => !value),
    toggleSide: () => setSide((value) => !value),
  }
}
