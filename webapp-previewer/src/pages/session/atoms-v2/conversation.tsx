import { For, Show, type JSX } from "solid-js"
import type { AtomsRow } from "../atoms/atoms-thread"
import type { AtomsV2Model } from "./state"

function Message(props: { row: Extract<AtomsRow, { kind: "user" | "assistant" }> }) {
  const err = () => (props.row.kind === "assistant" ? props.row.error : undefined)

  return (
    <article
      classList={{
        "atoms-v2-message": true,
        "atoms-v2-message--user": props.row.kind === "user",
        "atoms-v2-message--assistant": props.row.kind === "assistant",
        "is-error": !!err(),
      }}
    >
      <div class="atoms-v2-message__byline">
        <span />
        {props.row.kind === "user" ? "You" : "Assistant"}
      </div>
      <div class="atoms-v2-message__text">{props.row.text}</div>
      <Show when={err()}>
        {(msg) => <div class="atoms-v2-message__error">{msg()}</div>}
      </Show>
    </article>
  )
}

function Activity(props: { row: Extract<AtomsRow, { kind: "activity" | "decision" }> }) {
  return (
    <article
      classList={{
        "atoms-v2-activity": true,
        "atoms-v2-activity--decision": props.row.kind === "decision",
      }}
    >
      <div class="atoms-v2-activity__top">
        <span>{props.row.kind === "decision" ? "Needs input" : "Session activity"}</span>
      </div>
      <strong>{props.row.title}</strong>
      <p>{props.row.detail}</p>
    </article>
  )
}

function Row(props: { row: AtomsRow }) {
  if (props.row.kind === "user" || props.row.kind === "assistant") return <Message row={props.row} />
  return <Activity row={props.row} />
}

export function AtomsV2Conversation(props: {
  ui: AtomsV2Model
  title: string
  rows: AtomsRow[]
  composer: JSX.Element
}) {
  const live = () => props.rows.length > 0
  const count = () => {
    if (!live()) return props.ui.scene().id === "viewer-reference" ? "3 turns" : "7 open"
    const turns = props.rows.filter((row) => row.kind === "user").length
    const total = turns || props.rows.length
    return `${total} ${total === 1 ? "turn" : "turns"}`
  }

  return (
    <section data-component="atoms-v2-conversation" class="atoms-v2-conversation">
      <div class="atoms-v2-conversation__head">
        <div>
          <div class="atoms-v2-eyebrow">Conversation</div>
          <h1>{props.title}</h1>
          <p>Keep the shell visual-first, make the workspace feel like Atoms, and let the product surface breathe.</p>
        </div>
        <div class="atoms-v2-badge">{count()}</div>
      </div>
      <div class="atoms-v2-conversation__body">
        <Show
          when={live()}
          fallback={
            <For each={props.ui.scene().cards}>
              {(card) => (
                <article class={`atoms-v2-card atoms-v2-card--${card.tone}`}>
                  <div class="atoms-v2-card__top">
                    <span>{card.label}</span>
                    <span>{card.meta}</span>
                  </div>
                  <h2>{card.title}</h2>
                  <p>{card.text}</p>
                </article>
              )}
            </For>
          }
        >
          <div class="atoms-v2-chat">
            <For each={props.rows}>{(row) => <Row row={row} />}</For>
          </div>
        </Show>
      </div>
      <div class="atoms-v2-hints">
        <button>Scaffold UI</button>
        <button>Open changed files</button>
        <button>Review latest diff</button>
      </div>
      <div class="atoms-v2-composer">{props.composer}</div>
    </section>
  )
}
