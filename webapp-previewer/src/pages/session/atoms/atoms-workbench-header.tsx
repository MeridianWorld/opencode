import { Show } from "solid-js"
import { badge } from "./chrome"

export function AtomsWorkbenchHeader(props: { title: string; note?: string }) {
  return (
    <div
      data-component="atoms-workbench-header"
      style={{
        padding: "0.95rem 1.25rem",
        "border-bottom": "1px solid var(--atoms-line)",
        "flex-shrink": 0,
        background: "color-mix(in srgb, var(--atoms-card) 96%, transparent)",
      }}
    >
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="truncate text-[24px] leading-none font-semibold text-[var(--atoms-ink)]">{props.title}</div>
          <div class="mt-2 text-[13px] leading-6 text-[var(--atoms-soft)]">
            The right rail keeps one shell while each mode swaps in its own focused tool surface.
          </div>
        </div>
        <Show when={props.note}>
          {(value) => (
            <div class={badge()}>
              <span class="size-1.5 rounded-full bg-[var(--atoms-accent)]" />
              {value()}
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}
