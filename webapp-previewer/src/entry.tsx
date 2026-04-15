// @refresh reload

import "./index.css"
import { render } from "solid-js/web"
import App from "@/app"

const root = document.getElementById("root")
if (!(root instanceof HTMLElement)) {
  console.error("Root element not found")
}

if (root instanceof HTMLElement) {
  render(() => <App />, root)
}