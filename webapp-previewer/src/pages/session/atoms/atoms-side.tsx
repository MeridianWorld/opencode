import { Show, type JSX, type ParentProps } from "solid-js"

export function AtomsSide(props: ParentProps<{ head?: JSX.Element }>) {
  return (
    <section
      data-component="atoms-side"
      style={{ width: "100%", height: "100%", "min-width": "0", "min-height": "0", display: "flex", "flex-direction": "column" }}
    >
      <Show when={props.head}>{(value) => value()}</Show>
      <div style={{ "min-width": "0", "min-height": "0", flex: 1 }}>{props.children}</div>
    </section>
  )
}
