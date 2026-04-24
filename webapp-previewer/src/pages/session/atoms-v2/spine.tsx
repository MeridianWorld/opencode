import { For } from "solid-js"
import type { AtomsV2Model } from "./state"

export function AtomsV2Spine(props: { ui: AtomsV2Model; title: string }) {
  return (
    <aside data-component="atoms-v2-spine" class="atoms-v2-spine">
      <div class="atoms-v2-spine__head">
        <div class="atoms-v2-spine__avatar">A</div>
        <div>
          <strong>{props.title}</strong>
          <span>Live agent session</span>
        </div>
      </div>
      <div class="atoms-v2-spine__list">
        <div class="atoms-v2-spine__eyebrow">Workspace</div>
        <For each={props.ui.steps()}>
          {(item) => (
            <button
              classList={{ "atoms-v2-spine__item": true, "is-active": props.ui.step() === item.id }}
              onClick={() => props.ui.setStep(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.note}</small>
            </button>
          )}
        </For>
      </div>
      <p class="atoms-v2-spine__note">
        The left side stays calm and editorial. The right side stays bright, tool-like, and stable across modes.
      </p>
    </aside>
  )
}
