import { createEffect } from "solid-js"
import { demoWorkspace } from "./session/atoms-v2/demo-workspace"
import { demo } from "./session/atoms-v2/fallback"
import { AtomsV2Page } from "./session/atoms-v2/page"
import { createAtomsV2Model } from "./session/atoms-v2/state"

function Composer() {
  return (
    <div class="atoms-v2-demo-composer">
      <div class="atoms-v2-demo-composer__input">Ask anything... "Create a polished landing page"</div>
      <button type="button" aria-label="Add context">
        +
      </button>
      <button type="button" aria-label="Send prompt">
        ↑
      </button>
    </div>
  )
}

export default function HostedDemo() {
  const ui = createAtomsV2Model({
    data: () => demoWorkspace,
    load: () => {},
    toggle: () => {},
  })

  createEffect(() => {
    const path = ui.initial()
    if (!path) return
    if (ui.tabs().length > 0) return
    ui.open(path)
  })

  return <AtomsV2Page ui={ui} title={demo()} rows={[]} composer={<Composer />} />
}
