import { Show, type JSX, type ParentProps } from "solid-js"

export function AtomsSide(props: ParentProps<{ title: string; note?: JSX.Element }>) {
  return (
    <section
      data-component="atoms-side"
      style={{ width: "100%", height: "100%", "min-width": "0", "min-height": "0", display: "flex", "flex-direction": "column" }}
    >
      <div style={{ padding: "1rem 1.25rem", "border-bottom": "1px solid var(--atoms-line)", "flex-shrink": 0 }}>
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <div class="truncate text-[24px] leading-none font-semibold text-[var(--atoms-ink)]">{props.title}</div>
            <div class="mt-2 text-[13px] leading-6 text-[var(--atoms-soft)]">
              Preview, inspect, and file navigation stay in the same working surface.
            </div>
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
