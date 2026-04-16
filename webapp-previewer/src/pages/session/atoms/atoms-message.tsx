import type { AtomsRow } from "./atoms-thread"

const bubble = (role: AtomsRow["kind"]) => {
  const tone =
    role === "user"
      ? "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)]"
      : "border-[var(--atoms-line)] bg-[var(--atoms-card)] text-[var(--atoms-ink)]"
  const side = role === "user" ? "ml-auto" : ""
  return `max-w-[44rem] rounded-[26px] border px-4 py-3 shadow-[var(--atoms-shadow-soft)] ${tone} ${side}`
}

export function AtomsMessage(props: {
  row: Extract<AtomsRow, { kind: "user" | "assistant" }>
}) {
  return (
    <article class={bubble(props.row.kind)}>
      <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--atoms-soft)]">
        {props.row.kind === "user" ? "You" : "OpenCode"}
      </div>
      <div class="mt-2 whitespace-pre-wrap text-[14px] leading-7">{props.row.text}</div>
      {props.row.kind === "assistant" && props.row.error ? (
        <div class="mt-3 rounded-[18px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
          {props.row.error}
        </div>
      ) : null}
    </article>
  )
}
