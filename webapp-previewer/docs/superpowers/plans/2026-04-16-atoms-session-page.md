# Atoms Session Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `webapp-previewer` session page into an atoms-style chat + workbench experience while keeping OpenCode-compatible data flow, backend calls, and session behavior.

**Architecture:** Keep the existing Solid/Vite session route, providers, and sync sources as the behavioral core, then replace the visible session presentation with atoms-native components. The page will become a three-region layout: atoms chat workspace on the left, a thin atoms rail in the middle, and one unified workbench on the right with `Preview`, `Files`, `Editor`, and `Inspect` as modes of the same surface.

**Tech Stack:** SolidJS, TypeScript, Vite, Bun, Playwright, existing `useSDK` / `useSync` / preview backend integration in `webapp-previewer`.

---

## File Structure

### Existing files to modify

- `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
  - Replace the current hybrid shell composition with the new atoms page root.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\state.ts`
  - Expand atoms-local UI state so the page can drive one workbench with modes, file tabs, and active file.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\state.test.ts`
  - Lock down atoms state transitions before implementation.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-shell.tsx`
  - Host the outer page frame.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-rail.tsx`
  - Keep the approved thin atoms bridge rail.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-topbar.tsx`
  - Narrow the header surface to atoms-style identity and workbench metadata.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-stage.tsx`
  - Convert stage ownership from official timeline shell to atoms chat shell.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-side.tsx`
  - Stop treating the right side as duplicated independent panes.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-composer.tsx`
  - Re-skin the composer while preserving submit behavior.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview.tsx`
  - Reuse the preview backend route inside the new workbench.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\chrome.ts`
  - Extend shared atoms chrome tokens so new controls stay consistent.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-layout.spec.ts`
  - Update layout expectations to the approved three-region page.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-preview.spec.ts`
  - Keep preview behavior covered after the redesign.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workspace-tabs.spec.ts`
  - Rework this test around the new editor tab strip with close controls.
- `D:\github_repo\opencode\webapp-previewer\docs\superpowers\specs\2026-04-15-atoms-dev-web-design.md`
  - Append implementation discoveries, errors, and choices during execution.

### New files to create

- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
  - Composition root for the full atoms session page.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.ts`
  - Adapter that converts sync/session data into atoms-friendly row models.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.test.ts`
  - Focused unit coverage for the adapter output.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat.tsx`
  - Left chat workspace surface.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-header.tsx`
  - Session title, turn count, and metadata header.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-stream.tsx`
  - Scrollable chat row renderer.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-message.tsx`
  - Atoms-style user and assistant message blocks.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-activity-card.tsx`
  - Compact work-log card for tool/status output.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-decision-card.tsx`
  - First-class approval / question card.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench.tsx`
  - Single workbench controller.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench-header.tsx`
  - Header shared by all workbench modes.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-mode-switch.tsx`
  - Mode controls for `Preview`, `Files`, `Editor`, `Inspect`.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-files-pane.tsx`
  - File browsing mode.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-pane.tsx`
  - Editor mode surface.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-tabs.tsx`
  - Closable editor tab strip.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-inspect-pane.tsx`
  - Change / diff / inspection mode.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-chat.spec.ts`
  - End-to-end coverage for the atoms chat shell.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench.spec.ts`
  - End-to-end coverage for single workbench mode behavior.

### Existing files to stop using as live visual surfaces

- `D:\github_repo\opencode\webapp-previewer\src\pages\session\message-timeline.tsx`
  - Keep as a compatibility reference only, not as the rendered atoms chat surface.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\composer\session-composer-region.tsx`
  - Keep submit behavior, but do not reuse its visible chrome.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\file-tabs.tsx`
  - Do not reuse as the atoms editor-tab strip because it lacks the required atoms affordances.

### Task 1: Expand atoms session state for a single workbench

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\state.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "bun:test"
import { createAtomsState } from "./state"

describe("createAtomsState", () => {
  it("tracks workbench mode and closable editor tabs", () => {
    const state = createAtomsState()

    expect(state.mode()).toBe("preview")
    expect(state.fileTabs()).toEqual([])
    expect(state.activeFile()).toBeNull()

    state.setMode("files")
    state.openFile("src/app.tsx")
    state.openFile("src/index.tsx")
    state.activateFile("src/app.tsx")
    state.closeFile("src/index.tsx")

    expect(state.mode()).toBe("files")
    expect(state.fileTabs()).toEqual(["src/app.tsx"])
    expect(state.activeFile()).toBe("src/app.tsx")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test ./src/pages/session/atoms/state.test.ts`
Expected: FAIL because `mode`, `fileTabs`, `activeFile`, `openFile`, or `closeFile` do not exist yet on `createAtomsState()`.

- [ ] **Step 3: Write minimal implementation**

```ts
export type AtomsMode = "preview" | "files" | "editor" | "inspect"

export function createAtomsState() {
  const [mode, setMode] = createSignal<AtomsMode>("preview")
  const [tabs, setTabs] = createSignal<string[]>([])
  const [active, setActive] = createSignal<string | null>(null)

  const openFile = (path: string) => {
    setTabs((list) => list.includes(path) ? list : [...list, path])
    setActive(path)
    setMode("editor")
  }

  const activateFile = (path: string) => setActive(path)

  const closeFile = (path: string) => {
    const next = tabs().filter((item) => item !== path)
    setTabs(next)
    setActive(next.at(-1) ?? null)
  }

  return { mode, setMode, fileTabs: tabs, activeFile: active, openFile, activateFile, closeFile }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test ./src/pages/session/atoms/state.test.ts`
Expected: PASS with `1 pass` and no state API errors.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/state.ts D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/state.test.ts
git commit -m "refactor: expand atoms workbench state"
```

### Task 2: Create the atoms page composition root and shell skeleton

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-shell.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-rail.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-topbar.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-stage.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-side.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-layout.spec.ts`

- [ ] **Step 1: Write the failing layout expectation**

```ts
import { expect, test } from "@playwright/test"

test("renders the atoms three-region session page", async ({ page }) => {
  await page.goto("/preview")
  await expect(page.locator('[data-component="atoms-page"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-chat"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-rail"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-workbench"]')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/app/atoms-layout.spec.ts --workers=1 --reporter=line`
Expected: FAIL because the new page-level atoms markers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function AtomsPage() {
  return (
    <AtomsShell data-component="atoms-page">
      <AtomsStage>
        <AtomsChat />
      </AtomsStage>
      <AtomsRail data-component="atoms-rail" />
      <AtomsSide>
        <AtomsWorkbench />
      </AtomsSide>
    </AtomsShell>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx playwright test e2e/app/atoms-layout.spec.ts --workers=1 --reporter=line`
Expected: PASS with the atoms page, chat region, rail, and workbench all visible.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-page.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-shell.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-rail.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-topbar.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-stage.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-side.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-layout.spec.ts
git commit -m "feat: add atoms session page shell"
```

### Task 3: Build a pure atoms row adapter and left chat workspace

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.ts`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.test.ts`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-header.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-stream.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-message.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-activity-card.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-decision-card.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-composer.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.test.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-chat.spec.ts`

- [ ] **Step 1: Write the failing adapter and chat tests**

```ts
import { describe, expect, it } from "bun:test"
import { buildAtomsRows } from "./atoms-thread"

describe("buildAtomsRows", () => {
  it("maps sync rows into atoms chat row kinds", () => {
    const rows = buildAtomsRows([
      { kind: "user", text: "Ship the landing page" },
      { kind: "assistant", text: "Working on it" },
      { kind: "tool", title: "Scaffold UI" },
      { kind: "question", text: "Use React or Solid?" },
    ])

    expect(rows.map((row) => row.kind)).toEqual([
      "user",
      "assistant",
      "activity",
      "decision",
    ])
  })
})
```

```ts
import { expect, test } from "@playwright/test"

test("renders the atoms chat workspace instead of the official timeline shell", async ({ page }) => {
  await page.goto("/preview")
  await expect(page.locator('[data-component="atoms-chat-header"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-chat-stream"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-composer"]')).toBeVisible()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test ./src/pages/session/atoms/atoms-thread.test.ts`
Expected: FAIL because `buildAtomsRows()` does not exist yet.

Run: `bunx playwright test e2e/app/atoms-chat.spec.ts --workers=1 --reporter=line`
Expected: FAIL because the atoms chat header and stream markers are not rendered yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildAtomsRows(list: RowInput[]) {
  return list.flatMap((item) => {
    if (item.kind === "user") return [{ kind: "user", text: item.text }]
    if (item.kind === "assistant") return [{ kind: "assistant", text: item.text }]
    if (item.kind === "question") return [{ kind: "decision", text: item.text }]
    return [{ kind: "activity", title: item.title ?? "Working" }]
  })
}
```

```tsx
export function AtomsChat() {
  const rows = createMemo(() => buildAtomsRows(readSessionRows()))

  return (
    <section data-component="atoms-chat">
      <AtomsChatHeader data-component="atoms-chat-header" />
      <AtomsChatStream data-component="atoms-chat-stream" rows={rows()} />
      <AtomsComposer data-component="atoms-composer" />
    </section>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test ./src/pages/session/atoms/atoms-thread.test.ts`
Expected: PASS with stable row-kind mapping coverage.

Run: `bunx playwright test e2e/app/atoms-chat.spec.ts --workers=1 --reporter=line`
Expected: PASS with the new atoms chat shell visible.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-thread.ts D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-thread.test.ts D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-chat.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-chat-header.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-chat-stream.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-message.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-activity-card.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-decision-card.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-composer.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-page.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-chat.spec.ts
git commit -m "feat: add atoms chat workspace"
```

### Task 4: Build the single workbench surface and mode switch

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench-header.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-mode-switch.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-files-pane.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-inspect-pane.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-side.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-topbar.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench.spec.ts`

- [ ] **Step 1: Write the failing workbench test**

```ts
import { expect, test } from "@playwright/test"

test("switches workbench modes inside one atoms surface", async ({ page }) => {
  await page.goto("/preview")
  await page.getByRole("tab", { name: "Files" }).click()
  await expect(page.locator('[data-component="atoms-files-pane"]')).toBeVisible()
  await page.getByRole("tab", { name: "Inspect" }).click()
  await expect(page.locator('[data-component="atoms-inspect-pane"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-workbench"]')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/app/atoms-workbench.spec.ts --workers=1 --reporter=line`
Expected: FAIL because the workbench header, tabs, and pane markers are not implemented yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function AtomsWorkbench() {
  const state = useAtomsState()

  return (
    <section data-component="atoms-workbench">
      <AtomsWorkbenchHeader />
      <AtomsModeSwitch value={state.mode()} onChange={state.setMode} />
      <Switch>
        <Match when={state.mode() === "preview"}><AtomsPreview /></Match>
        <Match when={state.mode() === "files"}><AtomsFilesPane data-component="atoms-files-pane" /></Match>
        <Match when={state.mode() === "editor"}><AtomsEditorPane /></Match>
        <Match when={state.mode() === "inspect"}><AtomsInspectPane data-component="atoms-inspect-pane" /></Match>
      </Switch>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx playwright test e2e/app/atoms-workbench.spec.ts --workers=1 --reporter=line`
Expected: PASS with one stable workbench root while panes change by mode.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-workbench.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-workbench-header.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-mode-switch.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-files-pane.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-inspect-pane.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-page.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-side.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-topbar.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench.spec.ts
git commit -m "feat: add atoms single workbench"
```

### Task 5: Implement the editor pane with closable file tabs

**Files:**
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-pane.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-tabs.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workspace-tabs.spec.ts`

- [ ] **Step 1: Write the failing editor-tab test**

```ts
import { expect, test } from "@playwright/test"

test("editor tabs can switch and close files", async ({ page }) => {
  await page.goto("/preview")
  await page.getByRole("tab", { name: "Files" }).click()
  await page.getByText("README.md").click()
  await page.getByRole("tab", { name: "Editor" }).click()
  await expect(page.getByRole("button", { name: "Close README.md" })).toBeVisible()
  await page.getByRole("button", { name: "Close README.md" }).click()
  await expect(page.getByText("Select a file to start editing.")).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx playwright test e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=line`
Expected: FAIL because the editor tab strip either has no close buttons or does not drive the new atoms state yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function AtomsEditorTabs() {
  const state = useAtomsState()

  return (
    <div data-component="atoms-editor-tabs">
      <For each={state.fileTabs()}>
        {(path) => (
          <button type="button" onClick={() => state.activateFile(path)}>
            <span>{path.split("/").at(-1)}</span>
            <button
              type="button"
              aria-label={`Close ${path.split("/").at(-1)}`}
              onClick={(event) => {
                event.stopPropagation()
                state.closeFile(path)
              }}
            >
              ×
            </button>
          </button>
        )}
      </For>
    </div>
  )
}
```

```tsx
export function AtomsEditorPane() {
  const state = useAtomsState()

  return (
    <section data-component="atoms-editor-pane">
      <AtomsEditorTabs />
      <Show when={state.activeFile()} fallback={<div>Select a file to start editing.</div>}>
        <FileEditor path={state.activeFile()!} />
      </Show>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx playwright test e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=line`
Expected: PASS with a closable editor tab strip and a real editor empty state.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-editor-pane.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-editor-tabs.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-page.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-workbench.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workspace-tabs.spec.ts
git commit -m "feat: add closable atoms editor tabs"
```

### Task 6: Re-integrate preview and inspect into the new workbench and run regressions

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-inspect-pane.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-preview.spec.ts`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\webapp-previewer\use-webapp-preview.test.ts`
- Modify: `D:\github_repo\opencode\webapp-previewer\docs\superpowers\specs\2026-04-15-atoms-dev-web-design.md`

- [ ] **Step 1: Write the failing preview regression expectation**

```ts
import { expect, test } from "@playwright/test"

test("preview mode still renders the selected HTML target inside the atoms workbench", async ({ page }) => {
  await page.goto("/preview")
  await page.getByRole("tab", { name: "Preview" }).click()
  await page.getByText("index.html").click()
  await expect(page.locator('iframe[title="atoms-preview"]')).toBeVisible()
})
```

- [ ] **Step 2: Run tests to verify they fail when integration is incomplete**

Run: `bunx playwright test e2e/app/atoms-preview.spec.ts --workers=1 --reporter=line`
Expected: FAIL if the preview pane is not yet wired into the new workbench canvas.

Run: `bun test --preload ./happydom.ts ./src/webapp-previewer/use-webapp-preview.test.ts`
Expected: PASS or reveal any preview-hook regression introduced by the redesign.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function AtomsPreview() {
  const preview = useWebAppPreview()

  return (
    <section data-component="atoms-preview-pane">
      <AtomsPreviewToolbar targets={preview.targets()} selected={preview.selected()} />
      <Show when={preview.url()} fallback={<AtomsEmpty title="Awaiting preview" />}>
        <iframe title="atoms-preview" src={preview.url()!} />
      </Show>
    </section>
  )
}
```

```tsx
export function AtomsInspectPane() {
  const sync = useSync()

  return (
    <section data-component="atoms-inspect-pane">
      <Show when={sync.diffs().length} fallback={<AtomsEmpty title="No inspection data yet" />}>
        <InspectList items={sync.diffs()} />
      </Show>
    </section>
  )
}
```

- [ ] **Step 4: Run regressions to verify the redesign is healthy**

Run: `bun test ./src/pages/session/atoms/state.test.ts ./src/pages/session/atoms/atoms-thread.test.ts ./src/pages/session/atoms/atoms-preview-layout.test.ts`
Expected: PASS for atoms-local state, row mapping, and preview layout logic.

Run: `bun test --preload ./happydom.ts ./src/webapp-previewer/use-webapp-preview.test.ts`
Expected: PASS for preview target detection and `/view` URL generation.

Run: `bun typecheck`
Expected: PASS with no new TypeScript errors in `webapp-previewer`.

Run: `bunx playwright test e2e/app/atoms-layout.spec.ts e2e/app/atoms-chat.spec.ts e2e/app/atoms-workbench.spec.ts e2e/app/atoms-workspace-tabs.spec.ts e2e/app/atoms-preview.spec.ts --workers=1 --reporter=line`
Expected: PASS for the approved Phase 1 atoms session flows.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-preview.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-inspect-pane.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-preview.spec.ts D:/github_repo/opencode/webapp-previewer/src/webapp-previewer/use-webapp-preview.test.ts D:/github_repo/opencode/webapp-previewer/docs/superpowers/specs/2026-04-15-atoms-dev-web-design.md
git commit -m "feat: finish atoms session page redesign"
```

## Self-Review

### 1. Spec coverage

- Approved page structure:
  - covered by Task 2 and Task 4
- Left side must become atoms-like while preserving OpenCode behavior:
  - covered by Task 3
- Right side must become one workbench rather than duplicated panes:
  - covered by Task 1, Task 4, and Task 5
- `Editor` needs closable tabs:
  - covered by Task 1 and Task 5
- `Preview` must keep the official backend `/view` behavior:
  - covered by Task 6
- `Inspect` needs meaningful change review:
  - covered by Task 4 and Task 6
- User-required documentation updates during implementation:
  - covered by Task 6, which explicitly updates the design log

No spec gaps found after this review.

### 2. Placeholder scan

- Checked for `TODO`, `TBD`, "implement later", and vague "add tests" wording
- Each task includes exact files, concrete code shapes, commands, expected failures, expected passes, and commit points
- No unresolved placeholders remain in this plan

### 3. Type consistency

These names stay consistent across all tasks:

- `AtomsMode`
- `createAtomsState()`
- `mode()`
- `setMode()`
- `fileTabs()`
- `activeFile()`
- `openFile()`
- `activateFile()`
- `closeFile()`
- `buildAtomsRows()`
- `AtomsPage`
- `AtomsChat`
- `AtomsWorkbench`
- `AtomsEditorPane`
- `AtomsInspectPane`
- `AtomsPreview`

The earlier failed plan-write attempt exposed a tooling constraint rather than a design inconsistency:
- A single oversized `apply_patch` write failed on Windows with `Io(Os { code: 206, kind: InvalidFilename, message: "文件名或扩展名太长。" })`
- This plan was therefore written in smaller chunks
- That handling matches the user's requirement that error discovery and processing be recorded rather than silently ignored
