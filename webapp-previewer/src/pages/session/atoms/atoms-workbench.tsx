import { Match, Switch, type JSX } from "solid-js"
import { AtomsTopbar } from "./atoms-topbar"
import { AtomsWorkbenchHeader } from "./atoms-workbench-header"

export function AtomsWorkbench(props: {
  title: string
  note?: string
  active: string
  items: readonly { id: string; label: string }[]
  onSelect: (id: string) => void
  preview: JSX.Element
  editor: JSX.Element
  files: JSX.Element
  inspect: JSX.Element
}) {
  return (
    <section
      data-component="atoms-workbench"
      data-mode={props.active}
      style={{
        width: "100%",
        height: "100%",
        "min-width": "0",
        "min-height": "0",
        display: "flex",
        "flex-direction": "column",
      }}
    >
      <AtomsTopbar active={props.active} items={props.items} onSelect={props.onSelect} />
      <AtomsWorkbenchHeader title={props.title} note={props.note} />
      <div
        data-component="atoms-workbench-body"
        class="min-h-0 min-w-0 flex-1 overflow-hidden rounded-tl-[28px] bg-[color-mix(in_srgb,var(--atoms-card)_96%,white)]"
      >
        <Switch>
          <Match when={props.active === "preview"}>{props.preview}</Match>
          <Match when={props.active === "editor"}>{props.editor}</Match>
          <Match when={props.active === "files"}>{props.files}</Match>
          <Match when={props.active === "inspect"}>{props.inspect}</Match>
        </Switch>
      </div>
    </section>
  )
}
