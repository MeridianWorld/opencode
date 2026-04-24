export type Step = {
  id: string
  label: string
  note: string
}

export type Card = {
  id: string
  tone: "soft" | "info" | "result"
  label: string
  title: string
  text: string
  meta?: string
}

export type Tab = {
  id: string
  label: string
}

export type Tree = {
  id: string
  label: string
  kind: "folder" | "file"
  depth: number
}

export type Viewer = {
  app: string
  status: string
  targets: string[]
  pills: string[]
}

export type Scene = {
  id: string
  cards: Card[]
  viewer: Viewer
  tabs: Tab[]
  tree: Tree[]
  docs: Record<string, string>
}

export const steps: Step[] = [
  { id: "brief", label: "Brief", note: "Scope" },
  { id: "design", label: "Design", note: "App Viewer" },
  { id: "editor", label: "Editor", note: "Files" },
  { id: "launch", label: "Launch", note: "Inspect" },
]

const viewer: Viewer = {
  app: "EmailFlow",
  status: "Draft",
  targets: [
    "Landing page",
    "Reusable form",
    "Card system",
    "Settings panel",
    "Responsive preview",
  ],
  pills: ["Desktop", "Tablet", "Mobile", "Auto"],
}

const tabs: Tab[] = [
  { id: "index.html", label: "index.html" },
  { id: "SPEC.md", label: "SPEC.md" },
  { id: "styles.css", label: "styles.css" },
  { id: "app.js", label: "app.js" },
]

const tree: Tree[] = [
  { id: ".ruff_cache", label: ".ruff_cache", kind: "folder", depth: 0 },
  { id: "docs", label: "docs", kind: "folder", depth: 0 },
  { id: "app.js", label: "app.js", kind: "file", depth: 0 },
  { id: "index.html", label: "index.html", kind: "file", depth: 0 },
  { id: "SPEC.md", label: "SPEC.md", kind: "file", depth: 0 },
  { id: "styles.css", label: "styles.css", kind: "file", depth: 0 },
]

const docs: Record<string, string> = {
  "index.html": [
    "<main class=\"hero\">",
    "  <section class=\"intro\">",
    "    <h1>EmailFlow</h1>",
    "    <p>Draft campaigns, preview responses, and keep templates aligned.</p>",
    "  </section>",
    "</main>",
  ].join("\n"),
  "SPEC.md": [
    "# EmailFlow spec",
    "",
    "## Goals",
    "- Match the Atoms builder shell proportions",
    "- Keep the workspace calm and editorial",
    "- Make preview and editor feel like one product",
  ].join("\n"),
  "styles.css": [
    ":root {",
    "  --card: 26px;",
    "  --ink: #111318;",
    "  --line: rgba(16, 22, 34, 0.08);",
    "}",
    "",
    ".shell {",
    "  gap: 18px;",
    "  border-radius: 28px;",
    "}",
    "",
    ".capsule {",
    "  backdrop-filter: blur(18px);",
    "}",
    "",
    "/* spacing and capsule polish */",
  ].join("\n"),
  "app.js": [
    "const app = document.querySelector(\"[data-app]\")",
    "",
    "function sync(step) {",
    "  if (!app) return",
    "  app.dataset.step = step",
    "}",
    "",
    "sync(\"design\")",
  ].join("\n"),
}

export const viewerRef: Scene = {
  id: "viewer-reference",
  cards: [
    {
      id: "c1",
      tone: "soft",
      label: "Builder note",
      title: "Create a warm email assistant experience",
      text: "Keep the shell calm, light, and editorial. Make the preview feel product-like instead of IDE-like.",
      meta: "2m ago",
    },
    {
      id: "c2",
      tone: "info",
      label: "Agent plan",
      title: "Scaffold the shell and design surface",
      text: "Set the blue spine, balance the white work area, and make the composer read like a product tool.",
      meta: "Design pass",
    },
    {
      id: "c3",
      tone: "result",
      label: "Result",
      title: "Preview is ready for review",
      text: "Use the workbench tabs to switch between the viewer, files, and editor without losing the shell.",
      meta: "Milestone 1",
    },
  ],
  viewer,
  tabs,
  tree,
  docs,
}

export const editorRef: Scene = {
  id: "editor-reference",
  cards: [
    {
      id: "e1",
      tone: "soft",
      label: "Session",
      title: "The shell stays stable while the workspace swaps",
      text: "Viewer and editor should feel like two states of one workbench, not two different pages.",
      meta: "Active",
    },
    {
      id: "e2",
      tone: "info",
      label: "Open tabs",
      title: "Review the generated files",
      text: "Click a file in the tree, switch tabs across the strip, and close tabs without collapsing the document area.",
      meta: "7 open",
    },
    {
      id: "e3",
      tone: "result",
      label: "Goal",
      title: "Hold the Atoms visual language",
      text: "Large white surface, deep-blue spine, soft shells, low-noise chrome, and balanced negative space.",
      meta: "Locked",
    },
  ],
  viewer,
  tabs,
  tree,
  docs,
}
