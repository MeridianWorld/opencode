import { For, Show } from "solid-js"
import { AtomsActivityCard } from "./atoms-activity-card"
import { AtomsDecisionCard } from "./atoms-decision-card"
import { AtomsMessage } from "./atoms-message"
import type { AtomsRow } from "./atoms-thread"

export function AtomsChatStream(props: {
  rows: AtomsRow[]
  scrollRef?: (el: HTMLDivElement | undefined) => void
  onScroll?: (el: HTMLDivElement) => void
}) {
  return (
    <div
      data-component="atoms-chat-stream"
      data-scrollable
      ref={props.scrollRef}
      onScroll={(event) => props.onScroll?.(event.currentTarget)}
      style={{
        "min-width": "0",
        "min-height": "0",
        flex: 1,
        overflow: "auto",
        padding: "1.25rem 1.25rem 1.75rem",
      }}
    >
      <Show
        when={props.rows.length > 0}
        fallback={
          <div class="grid h-full min-h-[20rem] place-items-center rounded-[32px] border border-dashed border-[var(--atoms-line)] bg-[color-mix(in_srgb,var(--atoms-card)_96%,white)] px-6 text-center shadow-[var(--atoms-shadow-soft)]">
            <div class="max-w-md">
              <div class="text-[24px] font-semibold text-[var(--atoms-ink)]">Builder ready</div>
              <div class="mt-3 text-[14px] leading-7 text-[var(--atoms-soft)]">
                Start with a prompt below and this panel will turn the live session into a readable build log.
              </div>
            </div>
          </div>
        }
      >
        <div class="flex min-h-full flex-col gap-4">
          <For each={props.rows}>
            {(row) => (
              <>
                <Show when={row.kind === "user" || row.kind === "assistant"}>
                  <AtomsMessage row={row as Extract<AtomsRow, { kind: "user" | "assistant" }>} />
                </Show>
                <Show when={row.kind === "activity"}>
                  <AtomsActivityCard row={row as Extract<AtomsRow, { kind: "activity" }>} />
                </Show>
                <Show when={row.kind === "decision"}>
                  <AtomsDecisionCard row={row as Extract<AtomsRow, { kind: "decision" }>} />
                </Show>
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
