import { For } from "solid-js"
import type { AtomsV2Model } from "./state"

export function AtomsV2Files(props: { ui: AtomsV2Model }) {
  return (
    <section data-component="atoms-v2-files" class="atoms-v2-files">
      <div class="atoms-v2-files__head">
        <span>Workspace tree</span>
        <strong>{props.ui.tree().length} items</strong>
      </div>
      <div class="atoms-v2-files__list">
        <For each={props.ui.tree()}>
          {(item) => (
            <button
              classList={{ "atoms-v2-files__item": true, "is-file": item.kind === "file" }}
              style={{ "padding-left": `${18 + item.depth * 18}px` }}
              onClick={() => (item.kind === "file" ? props.ui.open(item.id) : props.ui.toggle(item.id))}
            >
              <span>{item.kind === "folder" ? ">" : "."}</span>
              <strong>{item.label}</strong>
              <small>{item.id}</small>
            </button>
          )}
        </For>
      </div>
    </section>
  )
}
