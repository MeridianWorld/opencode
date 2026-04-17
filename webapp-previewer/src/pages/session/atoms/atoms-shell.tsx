import type { JSX } from "solid-js"

export function AtomsShell(props: { chat: JSX.Element; rail: JSX.Element; workbench: JSX.Element }) {
  return (
    <section
      data-component="atoms-shell"
      style={{
        width: "100%",
        height: "100%",
        "min-height": "0",
        overflow: "hidden",
        display: "grid",
        "grid-template-columns": "minmax(24rem, 1.02fr) 11rem minmax(38rem, 1.62fr)",
        background:
          "linear-gradient(90deg, color-mix(in srgb, var(--atoms-page) 96%, #081326) 0%, var(--atoms-page) 24%, var(--atoms-page) 100%)",
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
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--atoms-chat) 98%, white) 0%, var(--atoms-chat) 100%)",
          "border-right": "1px solid var(--atoms-line)",
        }}
      >
        {props.chat}
      </div>
      <div
        style={{
          "min-width": "0",
          "min-height": "0",
          position: "relative",
          background:
            "linear-gradient(180deg, #17305d 0%, #102344 48%, #0c1c38 100%)",
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
          background: "linear-gradient(180deg, color-mix(in srgb, var(--atoms-surface) 98%, white) 0%, var(--atoms-surface) 100%)",
        }}
      >
        {props.workbench}
      </div>
    </section>
  )
}
