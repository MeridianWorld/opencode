import type { JSX } from "solid-js"

export function AtomsInspectPane(props: { children: JSX.Element }) {
  return (
    <div
      data-component="atoms-inspect-pane"
      class="flex h-full flex-col overflow-hidden bg-[color-mix(in_srgb,var(--atoms-panel)_92%,white)] contain-strict"
    >
      <div class="relative min-h-0 flex-1 overflow-hidden pt-2">{props.children}</div>
    </div>
  )
}
