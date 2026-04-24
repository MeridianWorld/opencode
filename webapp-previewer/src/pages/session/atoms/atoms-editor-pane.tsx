import { Tabs } from "@opencode-ai/ui/tabs"
import { For, Show } from "solid-js"
import { FileTabContent } from "@/pages/session/file-tabs"
import { AtomsEditorTabs } from "./atoms-editor-tabs"

export function AtomsEditorPane(props: {
  tabs: readonly string[]
  tab?: string
  setTab: (tab: string) => void
  close: (tab: string) => void
  path: (tab: string) => string | undefined
}) {
  return (
    <div
      data-component="atoms-editor-pane"
      class="flex size-full min-h-0 min-w-0 flex-col bg-[color-mix(in_srgb,var(--atoms-card)_98%,white)]"
    >
      <div class="border-b border-[var(--atoms-line)] px-4 py-3">
        <Show
          when={props.tabs.length > 0}
          fallback={
            <div class="text-[13px] leading-6 text-[var(--atoms-soft)]">
              Open a file from the workspace or review flow to start editing.
            </div>
          }
        >
          <div class="flex items-center justify-between gap-3">
            <AtomsEditorTabs tabs={props.tabs} tab={props.tab} setTab={props.setTab} close={props.close} path={props.path} />
            <div class="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--atoms-soft)]">
              {props.tabs.length} open
            </div>
          </div>
        </Show>
      </div>
      <Tabs
        value={props.tab ?? "empty"}
        onChange={(tab) => {
          if (tab === "empty") return
          props.setTab(tab)
        }}
        class="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        <Tabs.Content value="empty" class="mt-3 h-full">
          <div
            class="grid h-full min-h-[24rem] place-items-center px-6 text-center"
            style={{
              background:
                "var(--atoms-shell-glow), linear-gradient(180deg, color-mix(in srgb, var(--atoms-card) 92%, transparent), var(--atoms-surface))",
            }}
          >
            <div class="max-w-md">
              <div class="text-[26px] font-semibold text-[var(--atoms-ink)]">No open files</div>
              <div class="mt-3 text-[14px] leading-7 text-[var(--atoms-soft)]">
                Pick a file from the Files pane or jump here from review to open it in the editor.
              </div>
            </div>
          </div>
        </Tabs.Content>

        <For each={props.tabs}>{(tab) => <FileTabContent tab={tab} />}</For>
      </Tabs>
    </div>
  )
}
