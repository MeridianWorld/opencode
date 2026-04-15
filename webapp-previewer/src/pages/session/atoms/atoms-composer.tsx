import { For, Show, type ParentProps } from "solid-js"

export function AtomsComposer(props: ParentProps<{ hints?: readonly string[] }>) {
  return (
    <aside
      data-component="atoms-composer"
      style={{
        "flex-shrink": 0,
        padding: "0.75rem 1rem 1rem",
        "border-top": "1px solid var(--atoms-line)",
        background: "var(--atoms-chat)",
      }}
    >
      <Show when={props.hints && props.hints.length > 0}>
        <div class="mb-3 flex flex-wrap gap-2">
          <For each={props.hints}>
            {(item) => (
              <div class="rounded-full border border-[var(--atoms-line)] bg-white/70 px-3 py-1 text-[12px] font-medium text-[var(--atoms-soft)]">
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
          background: "#fff",
          "box-shadow": "0 20px 50px rgba(21,35,61,0.08)",
        }}
      >
        {props.children}
      </div>
    </aside>
  )
}
