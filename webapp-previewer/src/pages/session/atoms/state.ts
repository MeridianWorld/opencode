import { createSignal } from "solid-js"

export type AtomsMode = "preview" | "files" | "editor" | "inspect"
export type AtomsView = AtomsMode

export function createAtomsState() {
  const [mode, setMode] = createSignal<AtomsMode>("preview")
  const [fileTabs, setFileTabs] = createSignal<string[]>([])
  const [activeFile, setActiveFile] = createSignal<string | null>(null)
  const [rail, setRail] = createSignal(true)
  const [side, setSide] = createSignal(true)

  const openFile = (path: string) => {
    setFileTabs((tabs) => (tabs.includes(path) ? tabs : [...tabs, path]))
    setActiveFile(path)
    setMode("editor")
  }

  const activateFile = (path: string) => {
    if (!fileTabs().includes(path)) return
    setActiveFile(path)
  }

  const closeFile = (path: string) => {
    const tabs = fileTabs()
    if (!tabs.includes(path)) return

    const active = activeFile()
    const next = tabs.filter((item) => item !== path)
    setFileTabs(next)
    if (active !== path) return
    setActiveFile(next.at(-1) ?? null)
  }

  const syncFiles = (tabs: readonly string[], active?: string | null) => {
    setFileTabs((prev) => {
      if (prev.length === tabs.length && prev.every((item, i) => item === tabs[i])) return prev
      return [...tabs]
    })
    setActiveFile(active ?? null)
  }

  return {
    mode,
    fileTabs,
    activeFile,
    rail,
    side,
    setMode,
    openFile,
    activateFile,
    closeFile,
    syncFiles,
    toggleRail: () => setRail((value) => !value),
    toggleSide: () => setSide((value) => !value),
  }
}
