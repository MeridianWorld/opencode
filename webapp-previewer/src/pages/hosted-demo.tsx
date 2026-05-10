import { createEffect, createResource, createSignal } from "solid-js"
import { fetchDemoWorkspace } from "./session/atoms-v2/demo-api"
import { demoWorkspace } from "./session/atoms-v2/demo-workspace"
import { demo } from "./session/atoms-v2/fallback"
import { AtomsV2Page } from "./session/atoms-v2/page"
import { createAtomsV2Model } from "./session/atoms-v2/state"

export function DemoComposer() {
  const [text, setText] = createSignal("")

  return (
    <form class="atoms-v2-demo-composer" onSubmit={(event) => event.preventDefault()}>
      <textarea
        aria-label="Prompt"
        class="atoms-v2-demo-composer__input"
        placeholder={'Ask anything... "Create a polished landing page"'}
        rows={1}
        value={text()}
        onInput={(event) => setText(event.currentTarget.value)}
      />
      <button type="button" aria-label="Add context">
        +
      </button>
      <button type="submit" aria-label="Send prompt">
        ^
      </button>
    </form>
  )
}

export default function HostedDemo() {
  const [data] = createResource(() => fetchDemoWorkspace().catch(() => demoWorkspace))
  const ui = createAtomsV2Model({
    data: () => data() ?? demoWorkspace,
    load: () => {},
    toggle: () => {},
  })

  createEffect(() => {
    const path = ui.initial()
    if (!path) return
    if (ui.tabs().length > 0) return
    ui.open(path)
  })

  return <AtomsV2Page ui={ui} title={demo()} rows={[]} composer={<DemoComposer />} />
}
