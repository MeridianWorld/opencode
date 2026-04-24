import { createSignal } from "solid-js"
import { editorRef, steps, viewerRef, type Scene, type Tab } from "./fixtures"

export type Mode = "viewer" | "editor" | "files" | "inspect"

const start = () => editorRef.tabs.map((item) => ({ ...item }))

export function createAtomsV2Model() {
  const [mode, setMode] = createSignal<Mode>("viewer")
  const [step, setStep] = createSignal("design")
  const [tabs, setTabs] = createSignal<Tab[]>(start())
  const [active, setActive] = createSignal(editorRef.tabs[0]?.id ?? "")
  const [draft, setDraft] = createSignal("")
  const scene = (): Scene => (mode() === "viewer" ? viewerRef : editorRef)

  const open = (id: string) => {
    if (!editorRef.docs[id]) return
    const hit = editorRef.tabs.find((item) => item.id === id) ?? { id, label: id }
    if (!tabs().some((item) => item.id === id)) setTabs([...tabs(), hit])
    setActive(id)
  }

  const close = (id: string) => {
    const list = tabs()
    const idx = list.findIndex((item) => item.id === id)
    if (idx < 0) return
    const next = list.filter((item) => item.id !== id)
    setTabs(next)
    if (active() !== id) return
    const pick = next[idx - 1] ?? next[idx] ?? next.at(-1)
    setActive(pick?.id ?? "")
  }

  const set = (next: Mode) => {
    setMode(next)
    if (next === "viewer") {
      setStep("design")
      return
    }
    if (next === "editor") {
      setStep("editor")
      return
    }
  }

  return {
    mode,
    step,
    tabs,
    active,
    draft,
    scene,
    steps: () => steps,
    setMode: set,
    setStep,
    setActive,
    setDraft,
    open,
    close,
  }
}

export type AtomsV2Model = ReturnType<typeof createAtomsV2Model>
