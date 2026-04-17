import { For, Show } from "solid-js"

export function AtomsRail(props: {
  title: string
  subtitle: string
  active: string
  items: readonly { id: string; label: string; note?: string }[]
  onSelect: (id: string) => void
}) {
  return (
    <aside
      data-component="atoms-rail"
      style={{ width: "100%", height: "100%", display: "flex", "flex-direction": "column", padding: "1rem 0.9rem" }}
    >
      <div
        style={{
          padding: "0.95rem",
          "border-radius": "1.5rem",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.08)",
          "box-shadow": "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div class="flex items-center gap-3">
          <div class="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#4dd6c5,#3f6ef5)] text-lg font-semibold text-white">
            A
          </div>
          <div class="min-w-0">
            <div class="truncate text-[22px] font-semibold leading-none text-white">{props.title}</div>
            <div class="mt-1 text-[13px] text-white/65">{props.subtitle}</div>
          </div>
        </div>
      </div>

      <div style={{ "margin-top": "1.4rem", "font-size": "11px", "font-weight": 600, "text-transform": "uppercase", "letter-spacing": "0.24em", color: "rgba(255,255,255,0.45)" }}>
        Modes
      </div>
      <div style={{ "margin-top": "0.75rem", display: "flex", "flex-direction": "column", gap: "0.45rem" }}>
        <For each={props.items}>
          {(item) => (
            <button
              type="button"
              onClick={() => props.onSelect(item.id)}
              class="group rounded-[22px] border px-4 py-3 text-left transition"
              classList={{
                "border-white/10 bg-white/6 text-white/70 hover:bg-white/10": props.active !== item.id,
                "border-white/0 bg-white/16 text-white shadow-[0_18px_40px_rgba(4,13,27,0.24)]": props.active === item.id,
              }}
            >
              <div class="flex items-center gap-3">
                <div
                  class="size-2 rounded-full transition"
                  classList={{
                    "bg-white/30": props.active !== item.id,
                    "bg-[var(--atoms-accent)]": props.active === item.id,
                  }}
                />
                <div class="min-w-0 flex-1">
                  <div class="truncate text-[16px] font-medium">{item.label}</div>
                  <Show when={item.note}>
                    {(value) => <div class="mt-1 truncate text-[12px] text-current/65">{value()}</div>}
                  </Show>
                </div>
              </div>
            </button>
          )}
        </For>
      </div>
    </aside>
  )
}
