import type { JSX } from "solid-js"
import { badge } from "./chrome"

export function AtomsChatHeader(props: { title: string; note?: JSX.Element; subtitle?: string }) {
  return (
    <header
      data-component="atoms-chat-header"
      style={{
        "flex-shrink": 0,
        padding: "1.1rem 1.25rem 0.95rem",
        "border-bottom": "1px solid var(--atoms-line)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--atoms-card) 96%, transparent), color-mix(in srgb, var(--atoms-chat) 92%, transparent))",
      }}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--atoms-soft)]">Builder session</div>
          <div class="mt-3 truncate text-[26px] font-semibold tracking-[-0.02em] text-[var(--atoms-ink)]">
            {props.title}
          </div>
          <div class="mt-2 max-w-[32rem] text-[13px] leading-6 text-[var(--atoms-soft)]">
            {props.subtitle ?? "Use this panel to steer the build, answer blockers, and review progress as it lands."}
          </div>
        </div>
        <div class={`${badge()} mt-1`}>{props.note}</div>
      </div>
    </header>
  )
}
