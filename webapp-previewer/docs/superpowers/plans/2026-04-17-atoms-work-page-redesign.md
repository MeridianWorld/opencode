# Atoms Work Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild only the session work page into an Atoms-style builder workspace, with the left side as the session/conversation panel and the right side as the unified preview/editor/files/inspect workbench, while preserving OpenCode's official frontend data flow and backend calling patterns.

**Architecture:** Keep the existing `/session` route, `useSDK`, `useSync`, `useFile`, terminal state, prompt state, and `/view/...` preview backend behavior as the functional core. Replace the visible work-page shell with a session-only Atoms viewport that suppresses the default OpenCode titlebar/sidebar chrome for session routes, then rebuild the session panel, mode rail, and workbench as one coherent Atoms page.

**Tech Stack:** SolidJS, TypeScript, Bun, Vite, Playwright, existing OpenCode frontend contexts in `webapp-previewer`.

---

## File Structure

### Existing files to modify

- `D:\github_repo\opencode\webapp-previewer\src\pages\layout.tsx`
  - Add a session-route viewport path that hides the default OpenCode titlebar/sidebar only when rendering the work page.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
  - Replace the remaining hybrid page composition with the approved Atoms work-page shell.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-shell.tsx`
  - Rebalance layout proportions and region framing for the final work page.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
  - Become the full page composition root for the session work page.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat.tsx`
  - Reframe the left session panel to feel like Atoms rather than OpenCode chat.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-header.tsx`
  - Shrink the header into builder-style session identity chrome.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-stream.tsx`
  - Tighten message spacing and panel hierarchy.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-composer.tsx`
  - Turn the input region into a fixed builder dock.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-rail.tsx`
  - Reduce the rail to structural navigation and status.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-topbar.tsx`
  - Align workbench chrome with the approved Atoms hierarchy.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench.tsx`
  - Unify preview/editor/files/inspect as one workbench shell.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench-header.tsx`
  - Keep one shared header language across workbench modes.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview.tsx`
  - Preserve preview behavior while shifting visual priority to the canvas.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-files-pane.tsx`
  - Keep files focused on browsing/opening only.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-pane.tsx`
  - Make editor feel like a real code workspace.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-tabs.tsx`
  - Polish closable tabs into final builder-style tabs.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-inspect-pane.tsx`
  - Present inspect as a focused review station rather than a generic diff area.
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\chrome.ts`
  - Extend shared Atoms chrome primitives and tokens.
- `D:\github_repo\opencode\webapp-previewer\docs\superpowers\specs\2026-04-15-atoms-dev-web-design.md`
  - Append implementation findings, decisions, and validation results as work progresses.

### New files to create

- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-session-switcher.tsx`
  - Compact switcher/new-session entry for the left session panel.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-shell.spec.ts`
  - Verify the session route no longer shows the default OpenCode titlebar/sidebar shell.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-panel.spec.ts`
  - Verify the new left-side Atoms session panel behavior and framing.
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`
  - Verify the right workbench shell, mode switches, and shared header.

### Existing tests to keep green

- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-preview.spec.ts`
- `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workspace-tabs.spec.ts`
- `D:\github_repo\opencode\webapp-previewer\src\webapp-previewer\use-webapp-preview.test.ts`
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\state.test.ts`
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.test.ts`
- `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview-layout.test.ts`

---

### Task 1: Hide the default OpenCode page chrome on the session route only

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\layout.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-shell.spec.ts`

- [ ] **Step 1: Write the failing end-to-end test**

```ts
import { expect, test } from "../fixtures"

test("session route suppresses the default opencode chrome", async ({ page, project }) => {
  await project.open()

  await expect(page.locator('[data-component="atoms-page"]')).toBeVisible()
  await expect(page.locator("header").filter({ hasText: "Toggle sidebar" })).toHaveCount(0)
  await expect(page.locator('[data-component="sidebar-nav-desktop"]')).toHaveCount(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `D:\github_repo\opencode\webapp-previewer`:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts --workers=1 --reporter=line`

Expected: FAIL because the default titlebar and sidebar are still rendered around the session page.

- [ ] **Step 3: Write the minimal implementation**

```tsx
const session = createMemo(() => /\/session(?:\/|$)/.test(location.pathname))

return (
  <div class="relative flex-1 min-h-0 min-w-0 flex flex-col">
    <Show when={!session()}>
      <Titlebar />
    </Show>
    <Show
      when={session()}
      fallback={<DefaultShell>{props.children}</DefaultShell>}
    >
      <main class="size-full overflow-hidden bg-background-base">
        {props.children}
      </main>
    </Show>
    <Toast.Region />
  </div>
)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts --workers=1 --reporter=line`

Expected: PASS with no titlebar/sidebar visible on the session route.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/layout.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-session-shell.spec.ts
git commit -m "feat: isolate atoms session viewport"
```

---

### Task 2: Rebuild the page skeleton into the final Atoms work-page frame

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-page.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-shell.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-rail.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-topbar.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\chrome.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`

- [ ] **Step 1: Write the failing end-to-end test**

```ts
import { expect, test } from "../fixtures"

test("renders the approved three-region atoms work page", async ({ page, project }) => {
  await project.open()

  await expect(page.locator('[data-component="atoms-page"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-shell"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-chat"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-rail"]')).toBeVisible()
  await expect(page.locator('[data-component="atoms-workbench"]')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

`bun x playwright test e2e/app/atoms-workbench-shell.spec.ts --workers=1 --reporter=line`

Expected: FAIL because the current page still reflects the older hybrid shell.

- [ ] **Step 3: Write the minimal implementation**

```tsx
export function AtomsShell(props: { chat: JSX.Element; rail: JSX.Element; workbench: JSX.Element }) {
  return (
    <section
      data-component="atoms-shell"
      class="grid size-full overflow-hidden"
      style={{ "grid-template-columns": "minmax(24rem,0.95fr) 5.5rem minmax(42rem,1.45fr)" }}
    >
      <section class="min-w-0 min-h-0 border-r border-[var(--atoms-line)] bg-[var(--atoms-chat)]">
        {props.chat}
      </section>
      <aside data-component="atoms-rail" class="min-w-0 min-h-0 border-r border-[var(--atoms-line)] bg-[var(--atoms-rail)]">
        {props.rail}
      </aside>
      <section class="min-w-0 min-h-0 bg-[var(--atoms-surface)]">
        {props.workbench}
      </section>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

`bun x playwright test e2e/app/atoms-workbench-shell.spec.ts --workers=1 --reporter=line`

Expected: PASS with the three persistent regions visible.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-page.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-shell.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-rail.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-topbar.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/chrome.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-shell.spec.ts
git commit -m "feat: rebuild atoms work-page frame"
```

---

### Task 3: Rebuild the left side into a true Atoms session panel

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-header.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-chat-stream.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-message.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-activity-card.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-decision-card.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-composer.tsx`
- Create: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-session-switcher.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-panel.spec.ts`

- [ ] **Step 1: Write the failing end-to-end test**

```ts
import { expect, test } from "../fixtures"

test("renders an atoms builder-style session panel", async ({ page, project }) => {
  await project.open()

  const panel = page.locator('[data-component="atoms-chat"]')
  await expect(panel).toBeVisible()
  await expect(panel.getByText("Conversation")).toHaveCount(0)
  await expect(panel.locator('[data-component="atoms-session-switcher"]')).toBeVisible()
  await expect(panel.locator('[data-component="atoms-composer"]')).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

`bun x playwright test e2e/app/atoms-session-panel.spec.ts --workers=1 --reporter=line`

Expected: FAIL because the panel still shows the older OpenCode-like framing and no session switcher.

- [ ] **Step 3: Write the minimal implementation**

```tsx
export function AtomsChat(props: Props) {
  return (
    <section data-component="atoms-chat" class="flex h-full min-h-0 flex-col">
      <AtomsChatHeader title={props.title} note={props.note} />
      <AtomsSessionSwitcher data-component="atoms-session-switcher" />
      <AtomsChatStream rows={props.rows} />
    </section>
  )
}

export function AtomsComposer(props: ParentProps) {
  return (
    <aside data-component="atoms-composer" class="sticky bottom-0 border-t border-[var(--atoms-line)] bg-[var(--atoms-chat)]/95 backdrop-blur">
      {props.children}
    </aside>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

`bun x playwright test e2e/app/atoms-session-panel.spec.ts --workers=1 --reporter=line`

Expected: PASS with the new Atoms session panel, switcher, and composer dock visible.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-chat.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-chat-header.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-chat-stream.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-message.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-activity-card.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-decision-card.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-composer.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-session-switcher.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-session-panel.spec.ts
git commit -m "feat: rebuild atoms session panel"
```

---

### Task 4: Unify preview, editor, files, and inspect into one final workbench shell

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-workbench-header.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-files-pane.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-pane.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-editor-tabs.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-inspect-pane.tsx`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session.tsx`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-preview.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workspace-tabs.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`

- [ ] **Step 1: Write the failing end-to-end assertions**

```ts
import { expect, test } from "../fixtures"

test("workbench modes share one shell and real content surfaces", async ({ page, project }) => {
  await project.open()

  const shell = page.locator('[data-component="atoms-workbench"]')
  await expect(shell).toBeVisible()
  await expect(shell.getByRole("button", { name: "Preview" })).toBeVisible()
  await expect(shell.getByRole("button", { name: "Editor" })).toBeVisible()
  await expect(shell.getByRole("button", { name: "Files" })).toBeVisible()
  await expect(shell.getByRole("button", { name: "Inspect" })).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

`bun x playwright test e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=line`

Expected: FAIL because the current workbench chrome is still inconsistent across modes.

- [ ] **Step 3: Write the minimal implementation**

```tsx
export function AtomsWorkbench(props: Props) {
  return (
    <section data-component="atoms-workbench" class="flex h-full min-h-0 flex-col">
      <AtomsWorkbenchHeader title={props.title} note={props.note} />
      <AtomsModeSwitch active={props.active} onSelect={props.onSelect} />
      <div class="min-h-0 flex-1 overflow-hidden">
        <Switch>
          <Match when={props.active === "preview"}>{props.preview}</Match>
          <Match when={props.active === "editor"}>{props.editor}</Match>
          <Match when={props.active === "files"}>{props.files}</Match>
          <Match when={props.active === "inspect"}>{props.inspect}</Match>
        </Switch>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

`bun x playwright test e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=line`

Expected: PASS with one stable workbench shell and green preview/editor/files/inspect regressions.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-workbench.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-workbench-header.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-preview.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-files-pane.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-editor-pane.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-editor-tabs.tsx D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-inspect-pane.tsx D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-shell.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-preview.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workspace-tabs.spec.ts
git commit -m "feat: unify atoms workbench shell"
```

---

### Task 5: Final polish, docs, and regression lock

**Files:**
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\chrome.ts`
- Modify: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview-layout.ts`
- Modify: `D:\github_repo\opencode\webapp-previewer\docs\superpowers\specs\2026-04-15-atoms-dev-web-design.md`
- Test: `D:\github_repo\opencode\webapp-previewer\src\webapp-previewer\use-webapp-preview.test.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\state.test.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-thread.test.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\src\pages\session\atoms\atoms-preview-layout.test.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-shell.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-session-panel.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workbench-shell.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-preview.spec.ts`
- Test: `D:\github_repo\opencode\webapp-previewer\e2e\app\atoms-workspace-tabs.spec.ts`

- [ ] **Step 1: Write the failing visual-polish/regression expectation**

```ts
import { expect, test } from "../fixtures"

test("atoms work page keeps a cohesive builder shell after mode changes", async ({ page, project }) => {
  await project.open()

  const shell = page.locator('[data-component="atoms-shell"]')
  await expect(shell).toBeVisible()
  await page.getByRole("button", { name: "Files" }).click()
  await page.getByRole("button", { name: "Inspect" }).click()
  await page.getByRole("button", { name: "Preview" }).click()
  await expect(shell).toBeVisible()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-session-panel.spec.ts e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=line`

Expected: FAIL if any polish regression or inconsistent shell state remains.

- [ ] **Step 3: Write the minimal implementation**

```ts
export function toggle(active: boolean) {
  return active
    ? "rounded-full border border-[var(--atoms-accent)] bg-[var(--atoms-chip)] text-[var(--atoms-ink)]"
    : "rounded-full border border-[var(--atoms-line)] bg-[var(--atoms-card-muted)] text-[var(--atoms-soft)] hover:text-[var(--atoms-ink)]"
}
```

Also append one implementation record to the design spec covering:
- errors found
- decisions made
- verification commands run

- [ ] **Step 4: Run the full focused regression set**

Run:

`bun test --preload ./happydom.ts ./src/webapp-previewer/use-webapp-preview.test.ts ./src/pages/session/atoms/state.test.ts ./src/pages/session/atoms/atoms-thread.test.ts ./src/pages/session/atoms/atoms-preview-layout.test.ts`

Expected: PASS with all focused unit tests green.

Run:

`bun typecheck`

Expected: PASS with no type errors.

Run:

`bun x playwright test e2e/app/atoms-session-shell.spec.ts e2e/app/atoms-session-panel.spec.ts e2e/app/atoms-workbench-shell.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=line`

Expected: PASS with the full session work-page regression set green.

- [ ] **Step 5: Commit**

```bash
git add D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/chrome.ts D:/github_repo/opencode/webapp-previewer/src/pages/session/atoms/atoms-preview-layout.ts D:/github_repo/opencode/webapp-previewer/docs/superpowers/specs/2026-04-15-atoms-dev-web-design.md D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-session-shell.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-session-panel.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workbench-shell.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-preview.spec.ts D:/github_repo/opencode/webapp-previewer/e2e/app/atoms-workspace-tabs.spec.ts
git commit -m "feat: finish atoms work-page redesign"
```

---

## Self-Review

### Spec coverage

- Session-only scope is covered by Task 1 and Task 2.
- Left-side session redesign is covered by Task 3.
- Right-side workbench redesign is covered by Task 4.
- Final cohesion, docs, and regressions are covered by Task 5.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each task has explicit files, commands, expected outcomes, and commit boundaries.

### Type consistency

- The page-level terms are used consistently:
  - `Session Panel`
  - `Mode Rail`
  - `Workbench`
- The four workbench modes are used consistently:
  - `preview`
  - `editor`
  - `files`
  - `inspect`
