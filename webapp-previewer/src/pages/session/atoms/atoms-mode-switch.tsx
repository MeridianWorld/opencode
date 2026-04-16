import { For } from "solid-js"
import { pill } from "./chrome"

export function AtomsModeSwitch(props: {
  active: string
  items: readonly { id: string; label: string }[]
  onSelect: (id: string) => void
}) {
  return (
    <div data-component="atoms-mode-switch" class="flex flex-wrap items-center gap-2">
      <For each={props.items}>
        {(item) => (
          <button
            type="button"
            onClick={() => props.onSelect(item.id)}
            class={pill(props.active === item.id)}
          >
            {item.label}
          </button>
        )}
      </For>
    </div>
  )
}
