import { getFilename } from "@opencode-ai/util/path"
import { Tabs } from "@opencode-ai/ui/tabs"
import { For, Match, Show, Switch, type ComponentProps } from "solid-js"
import FileTree from "@/components/file-tree"
import { FileTabContent } from "@/pages/session/file-tabs"
import { pill, toggle } from "./chrome"

type Tree = ComponentProps<typeof FileTree>

export function AtomsFilesPane(props: {
  tree: "changes" | "all"
  setTree: (value: "changes" | "all") => void
  reviewLoading: boolean
  reviewLoadingText: string
  hasReview: boolean
  reviewEmpty: string
  filesEmpty: string
  empty: boolean
  diff: readonly string[]
  kinds: Tree["kinds"]
  active?: string
  open: (path: string) => void
  tabs: readonly string[]
  tab?: string
  setTab: (tab: string) => void
  path: (tab: string) => string | undefined
}) {
  return (
    <div
      data-component="atoms-files-pane"
      class="grid size-full min-h-0 min-w-0 grid-cols-1 xl:grid-cols-[17rem_minmax(0,1fr)]"
    >
      <aside class="min-h-0 min-w-0 border-b border-[var(--atoms-line)] bg-[var(--atoms-panel)] xl:border-b-0 xl:border-r">
        <div class="border-b border-[var(--atoms-line)] px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <div class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--atoms-soft)]">File tree</div>
            <div class="flex items-center gap-2 rounded-full border border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] p-1">
              <button type="button" class={toggle(props.tree === "changes")} onClick={() => props.setTree("changes")}>
                Changed
              </button>
              <button type="button" class={toggle(props.tree === "all")} onClick={() => props.setTree("all")}>
                All
              </button>
            </div>
          </div>
        </div>
        <div class="min-h-0 overflow-auto px-3 py-3">
          <Switch>
            <Match when={props.tree === "changes" && props.reviewLoading}>
              <div class="px-6 py-4 text-text-weak">{props.reviewLoadingText}</div>
            </Match>
            <Match when={props.tree === "changes" && !props.hasReview}>
              <div class="rounded-[24px] border border-dashed border-[var(--atoms-line)] bg-[var(--atoms-card)] px-4 py-5 text-[13px] leading-6 text-[var(--atoms-soft)]">
                {props.reviewEmpty}
              </div>
            </Match>
            <Match when={props.tree === "all" && props.empty}>
              <div class="rounded-[24px] border border-dashed border-[var(--atoms-line)] bg-[var(--atoms-card)] px-4 py-5 text-[13px] leading-6 text-[var(--atoms-soft)]">
                {props.filesEmpty}
              </div>
            </Match>
            <Match when={props.tree === "changes"}>
              <FileTree
                path=""
                class="pt-2"
                allowed={props.diff}
                kinds={props.kinds}
                draggable={false}
                active={props.active}
                onFileClick={(node) => props.open(node.path)}
              />
            </Match>
            <Match when={true}>
              <FileTree
                path=""
                class="pt-2"
                modified={props.diff}
                kinds={props.kinds}
                active={props.active}
                onFileClick={(node) => props.open(node.path)}
              />
            </Match>
          </Switch>
        </div>
      </aside>

      <div class="min-h-0 min-w-0 flex flex-col bg-[var(--atoms-card)]">
        <div class="shrink-0 border-b border-[var(--atoms-line)] px-4 py-3">
          <Show
            when={props.tabs.length > 0}
            fallback={<div class="text-[13px] leading-6 text-[var(--atoms-soft)]">Select a file to inspect it in the editor.</div>}
          >
            <div class="flex flex-wrap items-center gap-2">
              <For each={props.tabs}>
                {(tab) => (
                  <button type="button" onClick={() => props.setTab(tab)} class={pill(props.tab === tab)}>
                    {getFilename(props.path(tab) ?? tab)}
                  </button>
                )}
              </For>
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
                <div class="text-[26px] font-semibold text-[var(--atoms-ink)]">Editor ready</div>
                <div class="mt-3 text-[14px] leading-7 text-[var(--atoms-soft)]">
                  Open a generated file from the tree or jump from the review view to land here.
                </div>
              </div>
            </div>
          </Tabs.Content>

          <For each={props.tabs}>{(tab) => <FileTabContent tab={tab} />}</For>
        </Tabs>
      </div>
    </div>
  )
}
