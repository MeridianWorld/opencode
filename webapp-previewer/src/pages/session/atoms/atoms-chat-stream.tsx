import { For, Show } from "solid-js"
import { AtomsActivityCard } from "./atoms-activity-card"
import { AtomsDecisionCard } from "./atoms-decision-card"
import { AtomsMessage } from "./atoms-message"
import type { AtomsRow } from "./atoms-thread"

export function AtomsChatStream(props: { rows: AtomsRow[] }) {
  return (
    <div
      data-component="atoms-chat-stream"
      style={{
        "min-width": "0",
        "min-height": "0",
        flex: 1,
        overflow: "auto",
        padding: "1rem 1.25rem 1.5rem",
      }}
    >
      <Show
        when={props.rows.length > 0}
        fallback={
          <div class="grid h-full min-h-[20rem] place-items-center rounded-[32px] border border-dashed border-[var(--atoms-line)] bg-[var(--atoms-card)] px-6 text-center shadow-[var(--atoms-shadow-soft)]">
            <div class="max-w-md">
              <div class="text-[24px] font-semibold text-[var(--atoms-ink)]">Session ready</div>
              <div class="mt-3 text-[14px] leading-7 text-[var(--atoms-soft)]">
                Send a prompt below and the atoms chat stream will summarize the conversation here.
              </div>
            </div>
          </div>
        }
      >
        <div class="flex min-h-full flex-col gap-3">
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
