declare module "solid-js" {
  namespace JSX {
    interface CSSProperties {
      [property: string]: string | number | undefined
    }
  }
}

type CSSProperties = import("solid-js").JSX.CSSProperties

export {}
