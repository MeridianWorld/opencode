import { PromptInput } from "@/components/prompt-input"
import { useFile } from "@/context/file"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import type { FileNode } from "@opencode-ai/sdk/v2"
import { getFilename } from "@opencode-ai/util/path"
import { createEffect, createMemo } from "solid-js"
import { buildAtomsRows, reuseAtomsRows, type AtomsRow } from "./session/atoms/atoms-thread"
import { useSessionLayout } from "./session/session-layout"
import { AtomsV2Page } from "./session/atoms-v2/page"
import { createAtomsV2Model } from "./session/atoms-v2/state"
import { createWorkspaceData } from "./session/atoms-v2/workspace"

export default function Page() {
  const sdk = useSDK()
  const sync = useSync()
  const file = useFile()
  const route = useSessionLayout()
  const title = createMemo(() => getFilename(sync.project?.worktree ?? sdk.directory))
  const nodes = createMemo(() => {
    const visit = (dir: string): FileNode[] =>
      file.tree.children(dir).flatMap((item) =>
        item.type === "directory" && file.tree.state(item.path)?.expanded ? [item, ...visit(item.path)] : [item],
      )
    return visit("")
  })
  const data = createMemo(() =>
    createWorkspaceData({
      nodes: nodes(),
      content: (path) => file.get(path)?.content,
    }),
  )
  const ui = createAtomsV2Model({
    data,
    load: (path) => void file.load(path),
    toggle: (path) => file.tree.toggle(path),
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
    void file.tree.list("")
  })

  createEffect(() => {
    const path = ui.initial()
    if (!path) return
    if (ui.tabs().length > 0) return
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
