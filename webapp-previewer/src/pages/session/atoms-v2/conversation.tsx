import { For, type JSX } from "solid-js"
import type { AtomsV2Model } from "./state"

export function AtomsV2Conversation(props: { ui: AtomsV2Model; title: string; composer: JSX.Element }) {
  return (
    <section data-component="atoms-v2-conversation" class="atoms-v2-conversation">
      <div class="atoms-v2-conversation__head">
        <div>
          <div class="atoms-v2-eyebrow">Conversation</div>
          <h1>{props.title}</h1>
          <p>Keep the shell visual-first, make the workspace feel like Atoms, and let the product surface breathe.</p>
        </div>
        <div class="atoms-v2-badge">{props.ui.scene().id === "viewer-reference" ? "3 turns" : "7 open"}</div>
      </div>
      <div class="atoms-v2-conversation__body">
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
