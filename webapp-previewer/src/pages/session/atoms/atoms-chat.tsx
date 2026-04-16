import { Match, Show, Switch } from "solid-js"
import { NewSessionView } from "@/components/session"
import { AtomsStage } from "./atoms-stage"
import { AtomsChatHeader } from "./atoms-chat-header"
import { AtomsChatStream } from "./atoms-chat-stream"
import { badge } from "./chrome"
import type { AtomsRow } from "./atoms-thread"

export function AtomsChat(props: {
  title: string
  note: string
  rows: AtomsRow[]
  ready: boolean
  active: boolean
  newSessionWorktree: string
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
      }}
    >
      <AtomsStage
        eyebrow="Conversation"
        title={props.title}
        note={
          <div class={badge()}>
            <span class="size-1.5 rounded-full bg-[var(--atoms-accent)]" />
            {props.note}
          </div>
        }
      >
        <div class="flex min-h-0 flex-1 flex-col bg-[var(--atoms-chat)]">
          <Switch>
            <Match when={!props.active}>
              <NewSessionView worktree={props.newSessionWorktree} />
            </Match>
            <Match when={!props.ready}>
              <AtomsChatHeader title={props.title} note={<span>{props.note}</span>} />
              <div class="grid h-full min-h-[20rem] place-items-center text-[14px] text-[var(--atoms-soft)]">
                Loading session...
              </div>
            </Match>
            <Match when={true}>
              <AtomsChatHeader
                title={props.title}
                note={<span>{props.note}</span>}
                subtitle="Current OpenCode session content rendered with atoms-native message cards."
              />
              <AtomsChatStream rows={props.rows} />
            </Match>
          </Switch>
        </div>
      </AtomsStage>
    </section>
  )
}
