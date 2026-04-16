import type { JSX } from "solid-js"

export function AtomsInspectPane(props: { children: JSX.Element }) {
  return (
    <div data-component="atoms-inspect-pane" class="flex h-full flex-col overflow-hidden bg-background-stronger contain-strict">
      <div class="relative min-h-0 flex-1 overflow-hidden pt-2">{props.children}</div>
    </div>
  )
}
