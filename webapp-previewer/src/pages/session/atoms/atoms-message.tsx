import type { AtomsRow } from "./atoms-thread"

const bubble = (role: AtomsRow["kind"]) => {
  const tone =
    role === "user"
      ? "border-[var(--atoms-accent)]/30 bg-[color-mix(in_srgb,var(--atoms-chip)_62%,white)] text-[var(--atoms-ink)]"
      : "border-[var(--atoms-line)] bg-[color-mix(in_srgb,var(--atoms-card)_96%,white)] text-[var(--atoms-ink)]"
  const side = role === "user" ? "ml-auto" : ""
  const size = role === "user" ? "max-w-[32rem]" : "max-w-[40rem]"
  return `${size} rounded-[24px] border px-4 py-3 shadow-[var(--atoms-shadow-soft)] ${tone} ${side}`
}

export function AtomsMessage(props: {
  row: Extract<AtomsRow, { kind: "user" | "assistant" }>
}) {
  return (
    <article class={bubble(props.row.kind)}>
      <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--atoms-soft)]">
        <span
          class="size-2 rounded-full"
          classList={{
            "bg-[var(--atoms-accent)]": props.row.kind === "user",
            "bg-slate-300": props.row.kind === "assistant",
          }}
        />
        {props.row.kind === "user" ? "You" : "Assistant"}
      </div>
      <div class="mt-2 whitespace-pre-wrap text-[14px] leading-7">{props.row.text}</div>
      {props.row.kind === "assistant" && props.row.error ? (
        <div class="mt-3 rounded-[18px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] leading-6 text-amber-900">
          {props.row.error}
        </div>
      ) : null}
    </article>
  )
}
