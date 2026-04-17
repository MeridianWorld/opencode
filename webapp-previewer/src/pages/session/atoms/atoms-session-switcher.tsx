import { Show } from "solid-js"

export function AtomsSessionSwitcher(props: {
  name: string
  status: string
  note: string
  action?: string
  onAction?: () => void
}) {
  return (
    <section
      data-component="atoms-session-switcher"
      style={{
        "flex-shrink": 0,
        padding: "0.85rem 1.25rem 1rem",
        "border-bottom": "1px solid var(--atoms-line)",
        background: "color-mix(in srgb, var(--atoms-chat) 96%, white)",
      }}
    >
      <div class="flex items-center gap-3 rounded-[24px] border border-[var(--atoms-line)] bg-[color-mix(in_srgb,var(--atoms-card)_94%,white)] px-4 py-3 shadow-[var(--atoms-shadow-soft)]">
        <div class="grid size-11 shrink-0 place-items-center rounded-[18px] bg-[linear-gradient(135deg,#4dd6c5,#3f6ef5)] text-sm font-semibold text-white">
          A
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--atoms-soft)]">
            {props.status}
          </div>
          <div class="mt-1 truncate text-[15px] font-semibold text-[var(--atoms-ink)]">{props.name}</div>
          <div class="mt-1 text-[12px] text-[var(--atoms-soft)]">{props.note}</div>
        </div>
        <Show when={props.action && props.onAction}>
          <button
            type="button"
            onClick={() => props.onAction?.()}
            class="shrink-0 rounded-full border border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] px-3 py-1.5 text-[12px] font-medium text-[var(--atoms-ink)] transition hover:border-[var(--atoms-accent)]"
          >
            {props.action}
          </button>
        </Show>
      </div>
    </section>
  )
}
