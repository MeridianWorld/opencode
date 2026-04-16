import type { AtomsRow } from "./atoms-thread"

export function AtomsDecisionCard(props: { row: Extract<AtomsRow, { kind: "decision" }> }) {
  return (
    <article class="max-w-[40rem] rounded-[24px] border border-[var(--atoms-accent)]/35 bg-[var(--atoms-card)] px-4 py-3 shadow-[var(--atoms-shadow-soft)]">
      <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--atoms-soft)]">
        {props.row.request === "question" ? "Question waiting" : "Permission waiting"}
      </div>
      <div class="mt-2 text-[14px] font-medium text-[var(--atoms-ink)]">{props.row.title}</div>
      <div class="mt-1 text-[13px] leading-6 text-[var(--atoms-soft)]">{props.row.detail}</div>
      <div class="mt-3 rounded-[18px] border border-dashed border-[var(--atoms-line)] px-3 py-2 text-[12px] leading-6 text-[var(--atoms-soft)]">
        Respond in the composer below to continue this session.
      </div>
    </article>
  )
}
