import { For, Show, type ParentProps } from "solid-js"
import { hint } from "./chrome"

export function AtomsComposer(props: ParentProps<{ hints?: readonly string[] }>) {
  return (
    <aside
      data-component="atoms-composer"
      style={{
        "flex-shrink": 0,
        padding: "0.75rem 1rem 1rem",
        "border-top": "1px solid var(--atoms-line)",
        background: "var(--atoms-chat)",
        display: "flex",
        "flex-direction": "column",
        gap: "0.75rem",
      }}
    >
      <Show when={props.hints && props.hints.length > 0}>
        <div class="mb-3 flex flex-wrap gap-2">
          <For each={props.hints}>
            {(item) => (
              <div class={hint()}>
                <span class="size-1.5 rounded-full bg-[var(--atoms-accent)]" />
                {item}
              </div>
            )}
          </For>
        </div>
      </Show>
      <div
        style={{
          overflow: "hidden",
          "border-radius": "1.75rem",
          border: "1px solid var(--atoms-line)",
          background: "var(--atoms-card)",
          "box-shadow": "var(--atoms-shadow)",
        }}
      >
        {props.children}
      </div>
    </aside>
  )
}
