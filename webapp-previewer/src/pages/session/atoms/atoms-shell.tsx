import type { JSX } from "solid-js"

export function AtomsShell(props: {
  stage: JSX.Element
  rail: JSX.Element
  topbar: JSX.Element
  side: JSX.Element
  composer: JSX.Element
}) {
  return (
    <section
      data-component="atoms-shell"
      style={{
        width: "100%",
        height: "100%",
        "min-height": "0",
        overflow: "hidden",
        display: "grid",
        "grid-template-columns": "minmax(20rem, 0.92fr) 15rem minmax(26rem, 1.4fr)",
        background: "var(--atoms-page)",
        color: "var(--atoms-ink)",
      }}
    >
      <div
        style={{
          "min-width": "0",
          "min-height": "0",
          display: "flex",
          "flex-direction": "column",
          position: "relative",
          background: "var(--atoms-chat)",
          "border-right": "1px solid var(--atoms-line)",
        }}
      >
        {props.stage}
        {props.composer}
      </div>
      <div
        style={{
          "min-width": "0",
          "min-height": "0",
          position: "relative",
          background: "var(--atoms-rail)",
          color: "#fff",
          "border-right": "1px solid var(--atoms-line)",
        }}
      >
        {props.rail}
      </div>
      <div
        style={{
          "min-width": "0",
          "min-height": "0",
          display: "flex",
          "flex-direction": "column",
          position: "relative",
          background: "var(--atoms-surface)",
        }}
      >
        {props.topbar}
        <div style={{ "min-width": "0", "min-height": "0", flex: 1 }}>{props.side}</div>
      </div>
    </section>
  )
}
