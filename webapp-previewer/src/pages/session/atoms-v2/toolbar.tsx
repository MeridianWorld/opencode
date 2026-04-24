import type { Mode } from "./state"

const label = (mode: Mode) => {
  if (mode === "viewer") return "App Viewer"
  if (mode === "editor") return "Editor"
  if (mode === "files") return "Files"
  return "Inspect"
}

export function AtomsV2Toolbar(props: { title: string; mode: Mode }) {
  return (
    <header data-component="atoms-v2-toolbar" class="atoms-v2-toolbar">
      <div class="atoms-v2-toolbar__group">
        <button class="atoms-v2-icon" aria-label="Navigate back">
          <span class="atoms-v2-icon__line" />
        </button>
        <button class="atoms-v2-icon" aria-label="Navigate forward">
          <span class="atoms-v2-icon__line atoms-v2-icon__line--flip" />
        </button>
        <button class="atoms-v2-icon" aria-label="Open quick menu">
          <span class="atoms-v2-icon__grid" />
        </button>
      </div>
      <div class="atoms-v2-toolbar__group atoms-v2-toolbar__group--center">
        <div class="atoms-v2-pill atoms-v2-pill--title">
          <span class="atoms-v2-dot" />
          <span>{props.title}</span>
        </div>
        <div class="atoms-v2-pill">{label(props.mode)}</div>
        <div class="atoms-v2-pill atoms-v2-pill--muted">Draft workspace</div>
      </div>
      <div class="atoms-v2-toolbar__group">
        <button class="atoms-v2-pill atoms-v2-pill--muted">Share</button>
        <button class="atoms-v2-pill atoms-v2-pill--muted">Comments</button>
        <button class="atoms-v2-pill atoms-v2-pill--action">Publish</button>
      </div>
    </header>
  )
}
