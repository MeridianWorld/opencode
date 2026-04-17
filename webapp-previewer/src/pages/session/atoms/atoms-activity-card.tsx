import type { AtomsRow } from "./atoms-thread"

export function AtomsActivityCard(props: { row: Extract<AtomsRow, { kind: "activity" }> }) {
  return (
    <article class="max-w-[40rem] rounded-[24px] border border-[var(--atoms-line)] bg-[color-mix(in_srgb,var(--atoms-card-muted)_88%,white)] px-4 py-3 text-[var(--atoms-soft)] shadow-[var(--atoms-shadow-soft)]">
      <div class="text-[11px] font-semibold uppercase tracking-[0.18em]">Progress update</div>
      <div class="mt-2 text-[14px] font-medium text-[var(--atoms-ink)]">{props.row.title}</div>
      <div class="mt-1 whitespace-pre-wrap text-[13px] leading-6">{props.row.detail}</div>
    </article>
  )
}
