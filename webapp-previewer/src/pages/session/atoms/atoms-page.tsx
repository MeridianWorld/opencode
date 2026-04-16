import type { JSX } from "solid-js"
import { AtomsShell } from "./atoms-shell"

export function AtomsPage(props: { chat: JSX.Element; rail: JSX.Element; workbench: JSX.Element }) {
  return (
    <section
      data-component="atoms-page"
      style={{
        width: "100%",
        height: "100%",
        "min-height": "0",
        overflow: "hidden",
      }}
    >
      <AtomsShell chat={props.chat} rail={props.rail} workbench={props.workbench} />
    </section>
  )
}
