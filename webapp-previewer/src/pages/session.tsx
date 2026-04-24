import { PromptInput } from "@/components/prompt-input"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { getFilename } from "@opencode-ai/util/path"
import { createMemo } from "solid-js"
import { AtomsV2Page } from "./session/atoms-v2/page"
import { createAtomsV2Model } from "./session/atoms-v2/state"

export default function Page() {
  const sdk = useSDK()
  const sync = useSync()
  const ui = createAtomsV2Model()
  const title = createMemo(() => getFilename(sync.project?.worktree ?? sdk.directory))

  return (
    <AtomsV2Page
      ui={ui}
      title={title()}
      composer={<PromptInput newSessionWorktree="main" onNewSessionWorktreeReset={() => {}} onSubmit={() => {}} />}
    />
  )
}
