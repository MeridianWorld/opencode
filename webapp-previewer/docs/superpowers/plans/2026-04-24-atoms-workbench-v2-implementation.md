# Atoms Workbench V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `webapp-previewer` session workbench as a new front-end-first `atoms-v2` shell that visually matches the supplied Atoms workbench references, with milestone 1 covering the shared shell plus the `App Viewer` and `Editor` states.

**Architecture:** Keep the existing `/session` route as the mount boundary, but move all visible workbench authorship into a new `src/pages/session/atoms-v2/*` tree. Use stable scene fixtures and a small local state model to drive a deterministic Atoms-like shell, then verify that the route renders the new shell, the viewer/editor switch preserves the frame, and editor tabs can switch and close without breaking the page.

**Tech Stack:** SolidJS, TypeScript, Bun, Vite, Playwright, existing `webapp-previewer` route/layout infrastructure.

---

## File Structure

### Existing files to modify

- `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
  - Replace the current hybrid workbench rendering with a thin mount into the new `atoms-v2` shell.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-shell.spec.ts`
  - Update the route-level regression to assert the new Atoms workbench shell rather than the older hybrid shell.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`
  - Update workbench assertions to validate the new viewer/editor shell and persistent frame.
- `D:\github_repo\opencode\webapp-previewer\docs\superpowers\specs\2026-04-15-atoms-dev-web-design.md`
  - Append the reboot execution start, implementation findings, errors, and verification outcomes.

### New files to create

- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\fixtures.ts`
  - Stable demo scenes for the viewer and editor reference states.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\state.ts`
  - Small local state model for `mode`, `step`, `tabs`, `active`, `scene`, and composer draft.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\state.test.ts`
  - Unit tests for state transitions, step changes, mode switching, tab activation, and tab closing.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\page.tsx`
  - Top-level `atoms-v2` shell composition root.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\toolbar.tsx`
  - Floating capsule toolbar and publish action cluster.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\conversation.tsx`
  - Left conversation surface, result cards, and docked composer shell.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\spine.tsx`
  - Deep-blue workflow spine with current-step selection.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\viewer.tsx`
  - `App Viewer` work surface with the design-style app preview layout.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\editor.tsx`
  - `Editor` work surface with file tree, tab strip, document canvas, and closeable tabs.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\editor.test.tsx`
  - Component tests for editor tab switch/close behavior.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\atoms-v2.css`
  - Dedicated visual token layer and shell-specific CSS overrides.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-modes.spec.ts`
  - End-to-end regression for viewer/editor switching and tab interactions in the new shell.

### Existing tests to keep green

- `D:\github_repo\opencode\webapp-previewer\src\pages\session\file-tab-scroll.test.ts`
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\helpers.test.ts`
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\terminal-panel.test.ts`

---

### Task 1: Lock the new milestone-1 state model before UI work

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\fixtures.ts`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\state.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\state.test.ts`

- [ ] **Step 1: Write the failing unit test**

```ts
import { describe, expect, it } from "bun:test"
import { createAtomsV2Model } from "./state"

describe("createAtomsV2Model", () => {
  it("switches mode and keeps the shell state coherent", () => {
    const ui = createAtomsV2Model()

    expect(ui.mode()).toBe("viewer")
    ui.setMode("editor")
    expect(ui.mode()).toBe("editor")
    expect(ui.scene().id).toBe("editor-reference")
  })

  it("closes the active editor tab and falls back to a neighbor", () => {
    const ui = createAtomsV2Model()

    ui.setMode("editor")
    ui.open("styles.css")
    ui.close("styles.css")

    expect(ui.tabs().some((tab) => tab.id === "styles.css")).toBe(false)
    expect(ui.active()).toBe("app.js")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `D:\github_repo\opencode\webapp-previewer`:

`bun test --preload ./happydom.ts ./src/pages/session/atoms-v2/state.test.ts`

Expected: FAIL because `fixtures.ts` and `state.ts` do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
import { createSignal } from "solid-js"
import { editorScene, viewerScene } from "./fixtures"

export function createAtomsV2Model() {
  const [mode, setMode] = createSignal<"viewer" | "editor">("viewer")
  const [step, setStep] = createSignal("design")
  const [scene, setScene] = createSignal(viewerScene)
  const [tabs, setTabs] = createSignal(editorScene.tabs)
  const [active, setActive] = createSignal(editorScene.tabs[0].id)

  return {
    mode,
    step,
    scene,
    tabs,
    active,
    setMode: (next: "viewer" | "editor") => {
      setMode(next)
      setScene(next === "viewer" ? viewerScene : editorScene)
    },
    setStep,
    setActive,
    open: (id: string) => {
      const next = editorScene.tabs.find((tab) => tab.id === id)
      if (!next) return
      if (tabs().some((tab) => tab.id === id)) {
        setActive(id)
        return
      }
      setTabs([...tabs(), next])
      setActive(id)
    },
    close: (id: string) => {
      const list = tabs().filter((tab) => tab.id !== id)
      setTabs(list)
      if (active() === id) setActive(list.at(-1)?.id ?? "")
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

`bun test --preload ./happydom.ts ./src/pages/session/atoms-v2/state.test.ts`

Expected: PASS with the new small state model locked.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/fixtures.ts D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/state.ts D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/state.test.ts
git commit -m "test: lock atoms v2 workbench state"
```

---

### Task 2: Build the new Atoms shell, tokens, and viewer state

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\atoms-v2.css`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\toolbar.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\conversation.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\spine.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\viewer.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\page.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-shell.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`

- [ ] **Step 1: Write the failing route/workbench assertions**

```ts
import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("session route renders the new atoms-v2 shell", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open()

  await expect(page.locator('[data-component="atoms-v2-page"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-v2-toolbar"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-v2-conversation"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-v2-spine"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-v2-viewer"]')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-workbench-shell.spec.ts --workers=1 --reporter=line`

Expected: FAIL because the route still renders the previous shell and no `atoms-v2` markers exist.

- [ ] **Step 3: Write the minimal implementation**

```tsx
import "./atoms-v2.css"
import { AtomsV2Conversation } from "./conversation"
import { AtomsV2Spine } from "./spine"
import { AtomsV2Toolbar } from "./toolbar"
import { AtomsV2Viewer } from "./viewer"

export function AtomsV2Page(props: { ui: ReturnType<typeof createAtomsV2Model>; title: string }) {
  return (
    <div data-component="atoms-v2-page" class="atoms-v2-page">
      <AtomsV2Toolbar mode={props.ui.mode()} />
      <div class="atoms-v2-shell">
        <AtomsV2Conversation ui={props.ui} title={props.title} />
        <AtomsV2Spine ui={props.ui} />
        <AtomsV2Viewer scene={props.ui.scene()} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-workbench-shell.spec.ts --workers=1 --reporter=line`

Expected: PASS with the new outer shell, toolbar, left conversation surface, blue spine, and viewer surface visible.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/atoms-v2.css D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/toolbar.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/conversation.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/spine.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/viewer.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/page.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-session-shell.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-shell.spec.ts
git commit -m "feat: add atoms v2 viewer shell"
```

---

### Task 3: Build the editor surface and lock tab interactions

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\editor.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\editor.test.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-modes.spec.ts`

- [ ] **Step 1: Write the failing component and end-to-end tests**

```ts
import { render } from "@solidjs/testing-library"
import { describe, expect, it } from "bun:test"
import { AtomsV2Editor } from "./editor"
import { createAtomsV2Model } from "./state"

describe("AtomsV2Editor", () => {
  it("switches and closes tabs", () => {
    const ui = createAtomsV2Model()
    ui.setMode("editor")
    const view = render(() => <AtomsV2Editor ui={ui} />)

    view.getByRole("button", { name: /styles.css/i }).click()
    expect(view.getByText(/spacing and capsule polish/i)).toBeTruthy()
    view.getByRole("button", { name: /close styles.css/i }).click()
    expect(view.queryByRole("button", { name: /styles.css/i })).toBeNull()
  })
})
```

```ts
import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("viewer and editor share one stable atoms-v2 shell", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open()

  await page.getByRole("button", { name: /editor/i }).click()
  await expect(page.locator('[data-component="atoms-v2-editor"]')).toBeVisible()
  await page.getByRole("button", { name: /app.js/i }).click()
  await page.getByRole("button", { name: /close spec.md/i }).click()
  await expect(page.locator('[data-component="atoms-v2-shell"]')).toBeVisible()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

`bun test --preload ./happydom.ts ./src/pages/session/atoms-v2/editor.test.tsx`

Expected: FAIL because `editor.tsx` does not exist yet.

Run:

`bun x playwright test e2e/app/atoms-workbench-modes.spec.ts --workers=1 --reporter=line`

Expected: FAIL because the editor mode surface and closeable tabs are not implemented yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
import { For } from "solid-js"

export function AtomsV2Editor(props: { ui: ReturnType<typeof createAtomsV2Model> }) {
  return (
    <section data-component="atoms-v2-editor" class="atoms-v2-editor">
      <aside class="atoms-v2-tree">
        <For each={props.ui.scene().tree}>{(item) => <button onClick={() => props.ui.open(item.id)}>{item.label}</button>}</For>
      </aside>
      <div class="atoms-v2-doc">
        <div class="atoms-v2-tabs">
          <For each={props.ui.tabs()}>
            {(tab) => (
              <button aria-pressed={props.ui.active() === tab.id} onClick={() => props.ui.setActive(tab.id)}>
                {tab.label}
                <span role="button" aria-label={`Close ${tab.label}`} onClick={(e) => {
                  e.stopPropagation()
                  props.ui.close(tab.id)
                }}>
                  ×
                </span>
              </button>
            )}
          </For>
        </div>
        <pre>{props.ui.scene().docs[props.ui.active()]}</pre>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

`bun test --preload ./happydom.ts ./src/pages/session/atoms-v2/editor.test.tsx`

Expected: PASS with tab switching and closing green.

Run:

`bun x playwright test e2e/app/atoms-workbench-modes.spec.ts --workers=1 --reporter=line`

Expected: PASS with the stable shell preserved across viewer/editor switching.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/editor.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/editor.test.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-modes.spec.ts
git commit -m "feat: add atoms v2 editor interactions"
```

---

### Task 4: Mount the new shell on the session route and remove the old visible workbench

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms-v2\page.tsx`

- [ ] **Step 1: Write the failing route expectation**

```ts
import { expect, test } from "../fixtures"

test("session route no longer shows the previous atoms shell markers", async ({ page, project }) => {
  await project.open()

  await expect(page.locator('[data-component="atoms-shell"]')).toHaveCount(0)
  await expect(page.locator('[data-component="atoms-v2-page"]')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts --workers=1 --reporter=line`

Expected: FAIL because `session.tsx` still mounts the previous atoms shell.

- [ ] **Step 3: Write the minimal implementation**

```tsx
import { createMemo } from "solid-js"
import { getFilename } from "@opencode-ai/util/path"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { AtomsV2Page } from "./session/atoms-v2/page"
import { createAtomsV2Model } from "./session/atoms-v2/state"

export default function Page() {
  const sdk = useSDK()
  const sync = useSync()
  const ui = createAtomsV2Model()
  const title = createMemo(() => getFilename(sync.project?.worktree ?? sdk.directory))

  return <AtomsV2Page ui={ui} title={title()} />
}
```

- [ ] **Step 4: Run the focused route regressions**

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-workbench-modes.spec.ts --workers=1 --reporter=line`

Expected: PASS with the old visible shell gone and the new route-mounted shell active.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms-v2/page.tsx
git commit -m "feat: mount atoms v2 session workbench"
```

---

### Task 5: Verify, document, and lock the rebooted front-end shell

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\docs\superpowers\specs\2026-04-15-atoms-dev-web-design.md`
- Modify: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-shell.spec.ts`
- Modify: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`
- Modify: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-modes.spec.ts`

- [ ] **Step 1: Write the failing final-regression expectation**

```ts
import { expect } from "@playwright/test"
import { test } from "../fixtures"

test("atoms-v2 keeps the viewer and editor shell visually stable", async ({ page, project }) => {
  await page.setViewportSize({ width: 1728, height: 1117 })
  await project.open()

  const shell = page.locator('[data-component="atoms-v2-shell"]')
  await expect(shell).toBeVisible()
  await page.getByRole("button", { name: /editor/i }).click()
  await page.getByRole("button", { name: /app viewer/i }).click()
  await expect(shell).toBeVisible()
})
```

- [ ] **Step 2: Run verification to surface any remaining gaps**

Run:

`bun test --preload ./happydom.ts ./src/pages/session/atoms-v2/state.test.ts ./src/pages/session/atoms-v2/editor.test.tsx`

Expected: PASS if the new unit coverage is stable, otherwise fail and reveal missing behavior.

Run:

`bun typecheck`

Expected: PASS, otherwise surface any missing imports/types in the new shell.

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-workbench-modes.spec.ts --workers=1 --reporter=line`

Expected: PASS, otherwise reveal remaining shell or interaction regressions.

- [ ] **Step 3: Write the minimal implementation/documentation changes**

```md
### 2026-04-24 Record 54
Execution kickoff approved by the user:
- The user reviewed the front-end-first Atoms workbench v2 spec and instructed me to begin full implementation.
- I am now executing the milestone-1 implementation plan inline.
```

Also append:
- errors found during implementation
- how each error was resolved
- commands used for verification

- [ ] **Step 4: Run the full focused regression set one more time**

Run:

`bun test --preload ./happydom.ts ./src/pages/session/atoms-v2/state.test.ts ./src/pages/session/atoms-v2/editor.test.tsx`

Expected: PASS.

Run:

`bun typecheck`

Expected: PASS.

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-workbench-modes.spec.ts --workers=1 --reporter=line`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/docs/superpowers/specs/2026-04-15-atoms-dev-web-design.md D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-session-shell.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-shell.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-modes.spec.ts
git commit -m "feat: finish atoms v2 workbench reboot"
```

---

## Self-Review

### Spec coverage

- New `atoms-v2` tree instead of continuing the current hybrid shell: covered by Tasks 2, 3, and 4.
- Viewer and editor as the milestone-1 target states: covered by Tasks 2 and 3.
- Small local state model and stable demo scenes: covered by Task 1.
- Thin session route mount: covered by Task 4.
- Focused verification for the stable shell and interactions: covered by Task 5.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each task lists exact files, concrete commands, expected outcomes, and commit boundaries.

### Type consistency

- The new path consistently uses `atoms-v2`.
- The state model uses `mode`, `step`, `tabs`, `active`, and `scene` consistently.
- The two milestone-1 modes are used consistently as `viewer` and `editor`.
