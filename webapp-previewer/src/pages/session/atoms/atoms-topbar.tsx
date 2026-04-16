import { For, Show } from "solid-js"

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
                <span class="rounded-full border border-[var(--atoms-line)] px-3 py-1 text-[12px] font-medium text-[var(--atoms-soft)]">
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
                class="rounded-full border px-4 py-2 text-[14px] font-medium transition"
                classList={{
                  "border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] text-[var(--atoms-soft)] hover:border-[var(--atoms-accent)] hover:text-[var(--atoms-ink)]":
                    props.active !== item.id,
                  "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)] shadow-[var(--atoms-shadow-soft)]":
                    props.active === item.id,
                }}
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
