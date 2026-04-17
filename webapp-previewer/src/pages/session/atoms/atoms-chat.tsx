import { Match, Switch, type JSX } from "solid-js"
import { NewSessionView } from "@/components/session"
import { AtomsChatHeader } from "./atoms-chat-header"
import { AtomsChatStream } from "./atoms-chat-stream"
import type { AtomsRow } from "./atoms-thread"

export function AtomsChat(props: {
  title: string
  note: string
  rows: AtomsRow[]
  ready: boolean
  active: boolean
  newSessionWorktree: string
  switcher: JSX.Element
  scrollRef?: (el: HTMLDivElement | undefined) => void
  onScroll?: (el: HTMLDivElement) => void
}) {
  return (
    <section
      data-component="atoms-chat"
      style={{
        width: "100%",
        height: "100%",
        "min-width": "0",
        "min-height": "0",
        display: "flex",
        "flex-direction": "column",
        background: "var(--atoms-chat)",
      }}
    >
      <AtomsChatHeader
        title={props.title}
        note={<span>{props.note}</span>}
        subtitle="Guide the build, inspect updates, and keep the latest session context in view."
      />
      {props.switcher}
      <div class="min-h-0 flex-1 bg-[var(--atoms-chat)]">
        <Switch>
          <Match when={!props.active}>
            <div class="min-h-0 h-full overflow-auto px-5 pb-5 pt-4">
              <div class="rounded-[28px] border border-[var(--atoms-line)] bg-[color-mix(in_srgb,var(--atoms-card)_96%,white)] p-4 shadow-[var(--atoms-shadow-soft)]">
                <NewSessionView worktree={props.newSessionWorktree} />
              </div>
            </div>
          </Match>
          <Match when={!props.ready}>
            <div class="grid h-full min-h-[20rem] place-items-center px-6 text-center text-[14px] text-[var(--atoms-soft)]">
              <div>
                <div class="text-[24px] font-semibold text-[var(--atoms-ink)]">Loading session</div>
                <div class="mt-2 leading-7">Pulling the latest messages, files, and review context into this builder view.</div>
              </div>
            </div>
          </Match>
          <Match when={true}>
            <AtomsChatStream rows={props.rows} scrollRef={props.scrollRef} onScroll={props.onScroll} />
          </Match>
        </Switch>
      </div>
    </section>
  )
}
