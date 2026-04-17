import type { JSX } from "solid-js"
import { badge } from "./chrome"

export function AtomsChatHeader(props: { title: string; note?: JSX.Element; subtitle?: string }) {
  return (
    <header
      data-component="atoms-chat-header"
      style={{
        "flex-shrink": 0,
        padding: "1rem 1.25rem",
        "border-bottom": "1px solid var(--atoms-line)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--atoms-card) 96%, transparent), color-mix(in srgb, var(--atoms-chat) 92%, transparent))",
      }}
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--atoms-soft)]">Conversation</div>
          <div class="mt-2 truncate text-[28px] font-semibold tracking-[-0.02em] text-[var(--atoms-ink)]">
            {props.title}
          </div>
          <div class="mt-2 text-[14px] leading-6 text-[var(--atoms-soft)]">
            {props.subtitle ?? "The live session stream updates here."}
          </div>
        </div>
        <div class={badge()}>{props.note}</div>
      </div>
    </header>
  )
}
