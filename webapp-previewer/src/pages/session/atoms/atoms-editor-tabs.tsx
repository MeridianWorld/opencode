import { getFilename } from "@opencode-ai/util/path"
import { For } from "solid-js"

export function AtomsEditorTabs(props: {
  tabs: readonly string[]
  tab?: string
  setTab: (tab: string) => void
  close: (tab: string) => void
  path: (tab: string) => string | undefined
}) {
  return (
    <div data-component="atoms-editor-tabs" class="flex min-w-0 flex-wrap items-center gap-2">
      <For each={props.tabs}>
        {(tab) => {
          const path = () => props.path(tab) ?? tab
          const name = () => getFilename(path())
          const active = () => props.tab === tab
          const tone = () =>
            active()
              ? "border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)] shadow-[var(--atoms-shadow-soft)]"
              : "border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] text-[var(--atoms-soft)] hover:border-[var(--atoms-accent)] hover:text-[var(--atoms-ink)]"

          return (
            <div class={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[13px] transition ${tone()}`}>
              <button type="button" class="min-w-0 truncate pl-1 text-left" onClick={() => props.setTab(tab)}>
                {name()}
              </button>
              <button
                type="button"
                class="grid size-6 place-items-center rounded-full border border-transparent text-[11px] uppercase transition hover:border-[var(--atoms-line)] hover:bg-[var(--atoms-card)] hover:text-[var(--atoms-ink)]"
                aria-label={`Close ${name()}`}
                onClick={() => props.close(tab)}
              >
                x
              </button>
            </div>
          )
        }}
      </For>
    </div>
  )
}
