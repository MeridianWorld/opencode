import { createSignal } from "solid-js"
import { editorRef, steps, viewerRef, type Scene, type Tab } from "./fixtures"
import type { WorkspaceData } from "./workspace"

export type Mode = "viewer" | "editor" | "files" | "inspect"

const start = () => editorRef.tabs.map((item) => ({ ...item }))

type Source = {
  data: () => WorkspaceData
  load: (path: string) => void
  toggle: (path: string) => void
}

export function createAtomsV2Model(source?: Source) {
  const [mode, setMode] = createSignal<Mode>("viewer")
  const [step, setStep] = createSignal("design")
  const [tabs, setTabs] = createSignal<Tab[]>(source ? [] : start())
  const [active, setActive] = createSignal(source ? "" : (editorRef.tabs[0]?.id ?? ""))
  const [draft, setDraft] = createSignal("")
  const scene = (): Scene => (mode() === "viewer" ? viewerRef : editorRef)
  const tree = () => source?.data().tree ?? scene().tree
  const docs = () => source?.data().docs ?? scene().docs
  const preview = () => source?.data().preview
  const initial = () => source?.data().initial

  const hit = (id: string) => {
    const item = tree().find((next) => next.id === id)
    if (item?.kind === "file") return { id, label: item.label }
    return editorRef.tabs.find((next) => next.id === id) ?? { id, label: id }
  }

  const open = (id: string) => {
    if (!docs()[id] && !tree().some((item) => item.id === id && item.kind === "file")) return
    source?.load(id)
    const item = hit(id)
    if (!tabs().some((next) => next.id === id)) setTabs([...tabs(), item])
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
    tree,
    docs,
    preview,
    initial,
    steps: () => steps,
    setMode: set,
    setStep,
    setActive,
    setDraft,
    toggle: (path: string) => source?.toggle(path),
    open,
    close,
  }
}

export type AtomsV2Model = ReturnType<typeof createAtomsV2Model>
