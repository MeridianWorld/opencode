import { Show } from "solid-js"
import { badge } from "./chrome"

export function AtomsWorkbenchHeader(props: { title: string; note?: string }) {
  return (
    <div style={{ padding: "1rem 1.25rem", "border-bottom": "1px solid var(--atoms-line)", "flex-shrink": 0 }}>
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="truncate text-[24px] leading-none font-semibold text-[var(--atoms-ink)]">{props.title}</div>
          <div class="mt-2 text-[13px] leading-6 text-[var(--atoms-soft)]">
            Preview, inspect, and file navigation stay in the same working surface.
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
