import { PromptInput } from "@/components/prompt-input"
import { useFile } from "@/context/file"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import type { FileContent, FileNode } from "@opencode-ai/sdk/v2"
import { getFilename } from "@opencode-ai/util/path"
import { createEffect, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { buildAtomsRows, reuseAtomsRows, type AtomsRow } from "./session/atoms/atoms-thread"
import { useSessionLayout } from "./session/session-layout"
import { demo, pick } from "./session/atoms-v2/fallback"
import { AtomsV2Page } from "./session/atoms-v2/page"
import { createAtomsV2Model } from "./session/atoms-v2/state"
import { createWorkspaceData, rewriteHtml } from "./session/atoms-v2/workspace"

export default function Page() {
  const sdk = useSDK()
  const sync = useSync()
  const file = useFile()
  const route = useSessionLayout()
  const source = createMemo(() => sdk.directory)
  const fallback = createMemo(() => sync.ready && !source())
  const dir = createMemo(() => pick({ project: source(), fallback: demo() }))
  const title = createMemo(() => getFilename(dir()))
  const [state, setState] = createStore({
    children: {} as Record<string, FileNode[] | undefined>,
    content: {} as Record<string, FileContent | undefined>,
    expanded: {} as Record<string, boolean | undefined>,
    loaded: {} as Record<string, boolean | undefined>,
  })
  const local = createMemo(() => {
    const visit = (dir: string): FileNode[] =>
      file.tree.children(dir).flatMap((item) =>
        item.type === "directory" && file.tree.state(item.path)?.expanded ? [item, ...visit(item.path)] : [item],
      )
    return visit("")
  })
  const remote = createMemo(() => {
    const visit = (dir: string): FileNode[] =>
      (state.children[dir] ?? []).flatMap((item) =>
        item.type === "directory" && state.expanded[item.path] ? [item, ...visit(item.path)] : [item],
      )
    return visit("")
  })
  const nodes = createMemo(() => (fallback() ? remote() : local()))

  const list = (path: string) => {
    const root = dir()
    return sdk
      .createClient({ directory: root, throwOnError: true })
      .file.list({ path })
      .then((res) => {
        if (!fallback()) return
        if (dir() !== root) return
        setState("children", path, res.data ?? [])
      })
      .catch(() => {})
  }

  const load = (path: string) => {
    if (!fallback()) {
      void file.load(path)
      return
    }
    if (state.loaded[path]) return
    const root = dir()
    setState("loaded", path, true)
    void sdk
      .createClient({ directory: root, throwOnError: true })
      .file.read({ path })
      .then((res) => {
        if (!fallback()) return
        if (dir() !== root) return
        setState("content", path, res.data)
      })
      .catch(() => setState("loaded", path, false))
  }

  const toggle = (path: string) => {
    if (!fallback()) {
      file.tree.toggle(path)
      return
    }
    if (state.expanded[path]) {
      setState("expanded", path, false)
      return
    }
    setState("expanded", path, true)
    void list(path)
  }

  const data = createMemo(() =>
    createWorkspaceData({
      nodes: nodes(),
      content: (path) => (fallback() ? state.content[path] : file.get(path)?.content),
      html: (path, content) =>
        rewriteHtml({
          html: content,
          server: sdk.url,
          directory: dir(),
          path,
        }),
    }),
  )
  const ui = createAtomsV2Model({
    data,
    load,
    toggle,
  })
  const rows = createMemo((prev: AtomsRow[] = []) => {
    const id = route.params.id
    if (!id) return []
    return reuseAtomsRows(
      prev,
      buildAtomsRows({
        messages: sync.data.message[id] ?? [],
        partsByMessage: sync.data.part,
        questionRequest: () => sync.data.question[id]?.[0],
        permissionRequest: () => sync.data.permission[id]?.[0],
        sessionStatus: () => sync.data.session_status[id],
      }),
    )
  })

  createEffect(() => {
    const id = route.params.id
    if (!id) return
    void sync.session.sync(id)
  })

  createEffect(() => {
    if (fallback()) {
      void list("")
      return
    }
    void file.tree.list("")
  })

  createEffect(() => {
    const path = ui.initial()
    if (!path) return
    if (ui.tabs().length > 0 && ui.docs()[path]) return
    ui.open(path)
  })

  return (
    <AtomsV2Page
      ui={ui}
      title={title()}
      rows={rows()}
      composer={<PromptInput newSessionWorktree="main" onNewSessionWorktreeReset={() => {}} onSubmit={() => {}} />}
    />
  )
}
