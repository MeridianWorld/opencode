const base = "rounded-full border font-medium transition"

export function badge() {
  return `${base} inline-flex items-center gap-1.5 border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] px-2.5 py-1 text-[11px] text-[var(--atoms-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]`
}

export function hint() {
  return `${base} inline-flex items-center gap-2 border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] px-3 py-1.5 text-[12px] text-[var(--atoms-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]`
}

export function pill(active: boolean) {
  const state = active
    ? "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)] shadow-[var(--atoms-shadow-soft)]"
    : "border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] text-[var(--atoms-soft)] hover:border-[var(--atoms-accent)] hover:text-[var(--atoms-ink)]"
  return `${base} px-3 py-1.5 text-[13px] ${state}`
}

export function toggle(active: boolean) {
  const state = active
    ? "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)]"
    : "border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] text-[var(--atoms-soft)] hover:text-[var(--atoms-ink)]"
  return `${base} px-3 py-1 text-[12px] ${state}`
}

export function file(active: boolean) {
  const state = active
    ? "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)] shadow-[var(--atoms-shadow-soft)]"
    : "border-[var(--atoms-line)] bg-[var(--atoms-card)] text-[var(--atoms-soft)] hover:border-[var(--atoms-accent)]"
  return `${base} rounded-[18px] px-4 py-3 text-left ${state}`
}

export function stage() {
  return "min-h-0 flex-1 overflow-y-hidden overflow-x-visible"
}
