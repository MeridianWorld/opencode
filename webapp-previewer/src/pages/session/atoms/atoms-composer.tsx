import { For, Show, type ParentProps } from "solid-js"

export function AtomsComposer(props: ParentProps<{ hints?: readonly string[] }>) {
  return (
    <aside
      data-component="atoms-composer"
      style={{
        "flex-shrink": 0,
        padding: "0.85rem 1rem 1rem",
        "border-top": "1px solid var(--atoms-line)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--atoms-chat) 90%, transparent), color-mix(in srgb, var(--atoms-chat) 98%, white))",
        display: "flex",
        "flex-direction": "column",
        gap: "0.75rem",
      }}
    >
      <Show when={props.hints && props.hints.length > 0}>
        <div class="flex flex-wrap gap-2">
          <For each={props.hints}>
            {(item) => (
              <div class="inline-flex items-center gap-2 rounded-full border border-[var(--atoms-line)] bg-[color-mix(in_srgb,var(--atoms-card)_94%,white)] px-3 py-1.5 text-[12px] font-medium text-[var(--atoms-soft)] shadow-[var(--atoms-shadow-soft)]">
                <span class="size-1.5 rounded-full bg-[var(--atoms-accent)]/75" />
                {item}
              </div>
            )}
          </For>
        </div>
      </Show>
      <div
        style={{
          overflow: "hidden",
          "border-radius": "1.6rem",
          border: "1px solid var(--atoms-line)",
          background: "color-mix(in srgb, var(--atoms-card) 96%, white)",
          "box-shadow": "0 -14px 32px rgba(15, 23, 42, 0.08)",
        }}
      >
        {props.children}
      </div>
    </aside>
  )
}
