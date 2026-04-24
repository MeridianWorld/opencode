import { AtomsModeSwitch } from "./atoms-mode-switch"

export function AtomsTopbar(props: {
  active: string
  items: readonly { id: string; label: string }[]
  onSelect: (id: string) => void
}) {
  return (
    <header
      data-component="atoms-topbar"
      style={{
        "flex-shrink": 0,
        padding: "0.95rem 1.25rem",
        "border-bottom": "1px solid var(--atoms-line)",
        background: "color-mix(in srgb, var(--atoms-card) 94%, transparent)",
        "backdrop-filter": "blur(12px)",
      }}
    >
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "1rem", "flex-wrap": "wrap" }}>
        <div class="min-w-0">
          <div class="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--atoms-soft)]">
            Workbench
          </div>
          <div class="mt-2 text-[13px] leading-6 text-[var(--atoms-soft)]">
            Switch between preview, code, files, and review without leaving the same working surface.
          </div>
        </div>

        <AtomsModeSwitch active={props.active} items={props.items} onSelect={props.onSelect} />
      </div>
    </header>
  )
}
