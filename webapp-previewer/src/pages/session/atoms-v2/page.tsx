import "./atoms-v2.css"
import { Match, Switch, type JSX } from "solid-js"
import type { AtomsV2Model, Mode } from "./state"
import { AtomsV2Conversation } from "./conversation"
import { AtomsV2Editor } from "./editor"
import { AtomsV2Files } from "./files"
import type { AtomsRow } from "../atoms/atoms-thread"
import { AtomsV2Toolbar } from "./toolbar"
import { AtomsV2Viewer } from "./viewer"

const title = (mode: Mode) => {
  if (mode === "viewer") return "App Viewer"
  if (mode === "editor") return "Editor"
  if (mode === "files") return "Files"
  return "Inspect"
}

const note = (props: { ui: AtomsV2Model }) => {
  const mode = props.ui.mode()
  if (mode === "viewer") return `${props.ui.scene().viewer.targets.length} targets`
  if (mode === "editor") return `${props.ui.tabs().length} open`
  if (mode === "files") return "Workspace tree"
  return "Review changes"
}

function Placeholder(props: { title: string; text: string }) {
  return (
    <section class="atoms-v2-placeholder">
      <div>
        <strong>{props.title}</strong>
        <p>{props.text}</p>
      </div>
    </section>
  )
}

export function AtomsV2Page(props: { ui: AtomsV2Model; title: string; rows: AtomsRow[]; composer: JSX.Element }) {
  return (
    <div data-component="atoms-v2-page" class="atoms-v2-page">
      <AtomsV2Toolbar title={props.title} mode={props.ui.mode()} />
      <div data-component="atoms-v2-shell" class="atoms-v2-shell">
        <AtomsV2Conversation ui={props.ui} title={props.title} rows={props.rows} composer={props.composer} />
        <section data-component="atoms-v2-stage" class="atoms-v2-stage">
          <header class="atoms-v2-stage__head">
            <div>
              <div class="atoms-v2-stage__title">{title(props.ui.mode())}</div>
              <div class="atoms-v2-stage__note">{note(props)}</div>
            </div>
            <div class="atoms-v2-stage__nav">
              <button classList={{ "is-active": props.ui.mode() === "viewer" }} onClick={() => props.ui.setMode("viewer")}>
                App Viewer
              </button>
              <button classList={{ "is-active": props.ui.mode() === "editor" }} onClick={() => props.ui.setMode("editor")}>
                Editor
              </button>
              <button classList={{ "is-active": props.ui.mode() === "files" }} onClick={() => props.ui.setMode("files")}>
                Files
              </button>
              <button
                classList={{ "is-active": props.ui.mode() === "inspect" }}
                onClick={() => props.ui.setMode("inspect")}
              >
                Inspect
              </button>
            </div>
          </header>
          <div class="atoms-v2-stage__body">
            <Switch>
              <Match when={props.ui.mode() === "viewer"}>
                <AtomsV2Viewer scene={props.ui.scene()} preview={props.ui.preview()} />
              </Match>
              <Match when={props.ui.mode() === "editor"}>
                <AtomsV2Editor ui={props.ui} />
              </Match>
              <Match when={props.ui.mode() === "files"}>
                <AtomsV2Files ui={props.ui} />
              </Match>
              <Match when={props.ui.mode() === "inspect"}>
                <Placeholder
                  title="Inspect changes"
                  text="The inspect state remains visually integrated with the same workbench while the detailed diff workflow lands later."
                />
              </Match>
            </Switch>
          </div>
        </section>
      </div>
    </div>
  )
}
