import { Match, Switch, type ComponentProps } from "solid-js"
import FileTree from "@/components/file-tree"
import { toggle } from "./chrome"

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
}) {
  return (
    <div
      data-component="atoms-files-pane"
      class="flex size-full min-h-0 min-w-0 flex-col bg-[color-mix(in_srgb,var(--atoms-panel)_90%,white)]"
    >
      <div class="border-b border-[var(--atoms-line)] px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--atoms-soft)]">File tree</div>
            <div class="mt-2 text-[13px] leading-6 text-[var(--atoms-soft)]">
              Browse the workspace and open files in Editor.
            </div>
          </div>
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
      <div class="min-h-0 flex-1 overflow-auto px-3 py-3">
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
    </div>
  )
}
