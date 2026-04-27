import { For, Show } from "solid-js"
import type { AtomsV2Model } from "./state"

export function AtomsV2Editor(props: { ui: AtomsV2Model }) {
  const text = () => props.ui.docs()[props.ui.active()] ?? ""

  return (
    <section data-component="atoms-v2-editor" class="atoms-v2-editor">
      <aside class="atoms-v2-editor__tree">
        <div class="atoms-v2-editor__eyebrow">File tree</div>
        <For each={props.ui.tree()}>
          {(item) => (
            <button
              classList={{ "atoms-v2-editor__node": true, "is-file": item.kind === "file" }}
              style={{ "padding-left": `${18 + item.depth * 16}px` }}
              onClick={() => (item.kind === "file" ? props.ui.open(item.id) : props.ui.toggle(item.id))}
            >
              <span>{item.kind === "folder" ? ">" : "."}</span>
              <span>{item.label}</span>
            </button>
          )}
        </For>
      </aside>
      <div class="atoms-v2-editor__doc">
        <div class="atoms-v2-editor__tabs">
          <For each={props.ui.tabs()}>
            {(tab) => (
              <button
                classList={{ "atoms-v2-editor__tab": true, "is-active": props.ui.active() === tab.id }}
                aria-label={tab.label}
                onClick={() => props.ui.setActive(tab.id)}
              >
                <span>{tab.label}</span>
                <Show when={props.ui.tabs().length > 1}>
                  <span
                    role="button"
                    aria-label={`Close ${tab.label}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      props.ui.close(tab.id)
                    }}
                  >
                    x
                  </span>
                </Show>
              </button>
            )}
          </For>
          <div class="atoms-v2-editor__tools">
            <button aria-label="Split view" />
            <button aria-label="Fullscreen" />
          </div>
        </div>
        <pre class="atoms-v2-editor__code">{text()}</pre>
      </div>
    </section>
  )
}
