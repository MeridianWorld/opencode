import { Show, type JSX, type ParentProps } from "solid-js"

export function AtomsStage(props: ParentProps<{ eyebrow?: string; title: string; note?: JSX.Element }>) {
  return (
    <section
      data-component="atoms-stage"
      style={{ "min-width": "0", "min-height": "0", flex: 1, display: "flex", "flex-direction": "column" }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem 1rem",
          "border-bottom": "1px solid var(--atoms-line)",
          "flex-shrink": 0,
        }}
      >
        <Show when={props.eyebrow}>
          {(value) => (
            <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--atoms-soft)]">{value()}</div>
          )}
        </Show>
        <div class="mt-2 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 class="text-[28px] leading-[1.1] font-semibold text-[var(--atoms-ink)]">{props.title}</h2>
          </div>
          <Show when={props.note}>
            {(value) => <div class="shrink-0">{value()}</div>}
          </Show>
        </div>
      </div>
      <div style={{ "min-width": "0", "min-height": "0", flex: 1 }}>{props.children}</div>
    </section>
  )
}
