import { For, Show } from "solid-js"
import { badge, pill } from "./chrome"

export function AtomsTopbar(props: {
  title: string
  subtitle?: string
  active: string
  items: readonly { id: string; label: string }[]
  onSelect: (id: string) => void
}) {
  return (
    <header
      data-component="atoms-topbar"
      style={{
        "flex-shrink": 0,
        padding: "1rem 1.25rem",
        "border-bottom": "1px solid var(--atoms-line)",
        background: "color-mix(in srgb, var(--atoms-card) 92%, transparent)",
        "backdrop-filter": "blur(12px)",
      }}
    >
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "1rem", "flex-wrap": "wrap" }}>
        <div class="min-w-0">
          <div class="truncate text-[13px] font-medium text-[var(--atoms-soft)]">Atoms-style workspace</div>
          <div class="mt-1 flex items-center gap-3">
            <h3 class="truncate text-[30px] leading-none font-semibold text-[var(--atoms-ink)]">{props.title}</h3>
            <Show when={props.subtitle}>
              {(value) => (
                <span class={badge()}>
                  <span class="size-1.5 rounded-full bg-[var(--atoms-accent)]" />
                  {value()}
                </span>
              )}
            </Show>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
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
      </div>
    </header>
  )
}
