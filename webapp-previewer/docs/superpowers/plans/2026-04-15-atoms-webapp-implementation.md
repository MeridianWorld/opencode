# Atoms-Style Webapp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `webapp-previewer` 中把当前独立 demo 切回官方 Web 前端内核，并交付一个复刻 `atoms.dev` 工作台体验的 session 页面，同时继续使用官方 backend、SDK、sync 与 prompt 提交流程。

**Architecture:** 先恢复 `src/entry.tsx -> src/app.tsx -> router -> directory-layout -> session` 这条官方链路，让页面生命周期、provider 与路由组织方式和 `packages/app` 一致。再把 `src/pages/session.tsx` 重组为 atoms 风格工作台，内部继续复用现有消息时间线、文件上下文、prompt submit 和 preview 能力，而不是复制一套新的业务状态。

**Tech Stack:** SolidJS, @solidjs/router, @tanstack/solid-query, @opencode-ai/sdk, @opencode-ai/ui, Bun, Vite, Playwright

---

## File Structure

### Existing files to modify

- `webapp-previewer/src/entry.tsx`
- `webapp-previewer/src/app.tsx`
- `webapp-previewer/src/pages/session.tsx`
- `webapp-previewer/src/webapp-previewer/previewer.tsx`
- `webapp-previewer/src/webapp-previewer/use-webapp-preview.ts`
- `webapp-previewer/src/index.css`
- `webapp-previewer/e2e/app/session.spec.ts`

### New files to create

- `webapp-previewer/src/pages/session/atoms/state.ts`
- `webapp-previewer/src/pages/session/atoms/state.test.ts`
- `webapp-previewer/src/pages/session/atoms/atoms-shell.tsx`
- `webapp-previewer/src/pages/session/atoms/atoms-rail.tsx`
- `webapp-previewer/src/pages/session/atoms/atoms-stage.tsx`
- `webapp-previewer/src/pages/session/atoms/atoms-topbar.tsx`
- `webapp-previewer/src/pages/session/atoms/atoms-side.tsx`
- `webapp-previewer/src/pages/session/atoms/atoms-composer.tsx`
- `webapp-previewer/src/pages/session/atoms/atoms-preview.tsx`
- `webapp-previewer/e2e/app/atoms-bootstrap.spec.ts`
- `webapp-previewer/e2e/app/atoms-layout.spec.ts`
- `webapp-previewer/e2e/app/atoms-preview.spec.ts`

### Files to leave in place but stop extending

- `webapp-previewer/src/components/chat-panel.tsx`
- `webapp-previewer/src/components/right-panel.tsx`
- `webapp-previewer/src/components/editor-tab.tsx`
- `webapp-previewer/src/components/webapp-preview-tab.tsx`

These legacy demo files should remain untouched unless a later cleanup task explicitly removes them. The new implementation must stop importing them from the live entry path.

---

### Task 1: Restore the Official App Shell

**Files:**
- Modify: `webapp-previewer/src/entry.tsx`
- Modify: `webapp-previewer/src/app.tsx`
- Test: `webapp-previewer/e2e/app/atoms-bootstrap.spec.ts`

- [ ] **Step 1: Write the failing route/bootstrap e2e**

```ts
import { test, expect } from "../fixtures"
import { withSession } from "../actions"
import { promptSelector } from "../selectors"

test("opens a routed session through the official app shell", async ({ page, sdk, gotoSession }) => {
  await withSession(sdk, `atoms bootstrap ${Date.now()}`, async (session) => {
    await gotoSession(session.id)
    await expect(page.locator(promptSelector)).toBeVisible()
    await expect(page).toHaveURL(/\/session\//)
  })
})
```

- [ ] **Step 2: Run the new e2e and verify it fails against the current demo entry**

Run: `bun run test:e2e -- e2e/app/atoms-bootstrap.spec.ts`

Expected: FAIL because the current `src/app.tsx` bypasses the official router stack and does not boot the routed session shell.

- [ ] **Step 3: Replace the demo bootstrap with the official provider/router composition**

```tsx
// src/entry.tsx
// @refresh reload

import "./index.css"
import { render } from "solid-js/web"
import App from "@/app"

const root = document.getElementById("root")
if (!(root instanceof HTMLElement) && import.meta.env.DEV) {
  throw new Error("Root element not found")
}

if (root instanceof HTMLElement) {
  render(() => <App />, root)
}
```

```tsx
// src/app.tsx
import { Navigate, Route, Router } from "@solidjs/router"
import { lazy } from "solid-js"
import DirectoryLayout from "@/pages/directory-layout"
import { GlobalSDKProvider } from "@/context/global-sdk"
import { GlobalSyncProvider } from "@/context/global-sync"
import { PromptProvider } from "@/context/prompt"
import { TerminalProvider } from "@/context/terminal"
import { FileProvider } from "@/context/file"
import { CommentsProvider } from "@/context/comments"
import { PlatformProvider, type Platform } from "@/context/platform"
import { ServerConnection, ServerProvider } from "@/context/server"

const HomeRoute = lazy(() => import("@/pages/home"))
const Session = lazy(() => import("@/pages/session"))

const DEFAULT_SERVER_URL_KEY = "opencode.settings.dat:defaultServerUrl"

const getCurrentUrl = () =>
  import.meta.env.DEV
    ? `http://${import.meta.env.VITE_OPENCODE_SERVER_HOST ?? "localhost"}:${import.meta.env.VITE_OPENCODE_SERVER_PORT ?? "4096"}`
    : location.origin

const getDefaultUrl = () => localStorage.getItem(DEFAULT_SERVER_URL_KEY) ?? getCurrentUrl()

const SessionRoute = () => (
  <TerminalProvider>
    <FileProvider>
      <PromptProvider>
        <CommentsProvider>
          <Session />
        </CommentsProvider>
      </PromptProvider>
    </FileProvider>
  </TerminalProvider>
)

const platform: Platform = {
  platform: "web",
  version: "1.0.0",
  openLink: (url) => window.open(url, "_blank"),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  restart: async () => window.location.reload(),
  notify: async () => {},
  getDefaultServer: async () => ServerConnection.Key.make(getDefaultUrl()),
  setDefaultServer: () => {},
}

// Port the official helper/provider definitions into this same file above App():
// QueryProvider, AppBaseProviders, RouterRoot, and ConnectionGate.
export default function App() {
  const server: ServerConnection.Http = { type: "http", http: { url: getCurrentUrl() } }
  return (
    <PlatformProvider value={platform}>
      <AppBaseProviders>
        <ServerProvider defaultServer={ServerConnection.Key.make(getDefaultUrl())} servers={[server]} disableHealthCheck>
          <GlobalSDKProvider>
            <GlobalSyncProvider>
              <Router root={(props) => <>{props.children}</>}>
                <Route path="/" component={HomeRoute} />
                <Route path="/:dir" component={DirectoryLayout}>
                  <Route path="/" component={() => <Navigate href="session" />} />
                  <Route path="/session/:id?" component={SessionRoute} />
                </Route>
              </Router>
            </GlobalSyncProvider>
          </GlobalSDKProvider>
        </ServerProvider>
      </AppBaseProviders>
    </PlatformProvider>
  )
}
```

Implementation notes:

- Mirror the official `packages/app/src/app.tsx` structure inside `webapp-previewer/src/app.tsx` instead of inventing a parallel wrapper.
- Keep route registration identical to the official app:
  - `/`
  - `/:dir`
  - `/:dir/session/:id?`
- Delete all imports of `ChatPanel` and `RightPanel` from the live entry path.

- [ ] **Step 4: Re-run the bootstrap e2e**

Run: `bun run test:e2e -- e2e/app/atoms-bootstrap.spec.ts`

Expected: PASS. The app should open through the official routing shell and land on the routed session page with the standard prompt.

- [ ] **Step 5: Commit**

```bash
git add webapp-previewer/src/entry.tsx webapp-previewer/src/app.tsx webapp-previewer/e2e/app/atoms-bootstrap.spec.ts
git commit -m "feat: restore official webapp shell bootstrap"
```

### Task 2: Add Atoms Layout State and Shell Components

**Files:**
- Create: `webapp-previewer/src/pages/session/atoms/state.ts`
- Create: `webapp-previewer/src/pages/session/atoms/state.test.ts`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-shell.tsx`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-rail.tsx`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-stage.tsx`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-topbar.tsx`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-side.tsx`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-composer.tsx`
- Modify: `webapp-previewer/src/index.css`

- [ ] **Step 1: Write the failing local state test**

```ts
import { describe, expect, test } from "bun:test"
import { createAtomsState } from "./state"

describe("createAtomsState", () => {
  test("defaults to preview and can switch the side view", () => {
    const atoms = createAtomsState()
    expect(atoms.view()).toBe("preview")
    atoms.setView("files")
    expect(atoms.view()).toBe("files")
  })
})
```

- [ ] **Step 2: Run the state test to verify it fails**

Run: `bun test --preload ./happydom.ts ./src/pages/session/atoms/state.test.ts`

Expected: FAIL with module not found for `./state`.

- [ ] **Step 3: Implement focused atoms state and layout components**

```ts
// src/pages/session/atoms/state.ts
import { createSignal } from "solid-js"

export type AtomsView = "preview" | "editor" | "files" | "inspect"

export function createAtomsState() {
  const [view, setView] = createSignal<AtomsView>("preview")
  const [rail, setRail] = createSignal(true)
  const [side, setSide] = createSignal(true)
  return {
    view,
    rail,
    side,
    setView,
    toggleRail: () => setRail((value) => !value),
    toggleSide: () => setSide((value) => !value),
  }
}
```

```tsx
// src/pages/session/atoms/atoms-shell.tsx
import { type JSX } from "solid-js"

export function AtomsShell(props: {
  rail: JSX.Element
  topbar: JSX.Element
  stage: JSX.Element
  side: JSX.Element
  composer: JSX.Element
}) {
  return (
    <div class="atoms-shell">
      <aside class="atoms-rail">{props.rail}</aside>
      <section class="atoms-main">
        <header class="atoms-topbar">{props.topbar}</header>
        <main class="atoms-stage">{props.stage}</main>
        <footer class="atoms-composer">{props.composer}</footer>
      </section>
      <aside class="atoms-side">{props.side}</aside>
    </div>
  )
}
```

```css
/* src/index.css */
:root {
  --atoms-bg: #f4efe7;
  --atoms-panel: rgba(255, 252, 247, 0.88);
  --atoms-line: rgba(24, 24, 24, 0.08);
  --atoms-text: #1d1d1b;
  --atoms-muted: #6d665e;
  --atoms-accent: #d96d32;
  --atoms-shadow: 0 20px 60px rgba(44, 31, 17, 0.12);
}

.atoms-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 420px;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(217, 109, 50, 0.12), transparent 32%),
    linear-gradient(180deg, #f8f3ec 0%, #efe6da 100%);
}
```

Implementation notes:

- Keep component files small and focused.
- Do not move message or prompt business logic into this state object.
- Store only display concerns here: active side view, rail visibility, side visibility.

- [ ] **Step 4: Re-run the state test**

Run: `bun test --preload ./happydom.ts ./src/pages/session/atoms/state.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add webapp-previewer/src/pages/session/atoms webapp-previewer/src/index.css
git commit -m "feat: add atoms session shell primitives"
```

### Task 3: Recompose the Session Page Around the Atoms Shell

**Files:**
- Modify: `webapp-previewer/src/pages/session.tsx`
- Create: `webapp-previewer/e2e/app/atoms-layout.spec.ts`
- Modify: `webapp-previewer/src/pages/session/atoms/atoms-rail.tsx`
- Modify: `webapp-previewer/src/pages/session/atoms/atoms-stage.tsx`
- Modify: `webapp-previewer/src/pages/session/atoms/atoms-topbar.tsx`

- [ ] **Step 1: Write the failing session layout e2e**

```ts
import { test, expect } from "../fixtures"

test("shows the atoms workbench layout for a session", async ({ project, page }) => {
  await project.open()
  const sessionID = await project.user("Create an index.html with a hero headline")
  await project.gotoSession(sessionID)

  await expect(page.getByText("Preview")).toBeVisible()
  await expect(page.getByText("Files")).toBeVisible()
  await expect(page.locator('[data-component="prompt-input"]')).toBeVisible()
})
```

- [ ] **Step 2: Run the e2e and verify it fails before the session rewrite**

Run: `bun run test:e2e -- e2e/app/atoms-layout.spec.ts`

Expected: FAIL because the current session page still renders the old official arrangement plus a bolted-on previewer rather than the atoms workbench shell.

- [ ] **Step 3: Replace the top-level session layout with an atoms composition layer**

```tsx
// inside src/pages/session.tsx
import { AtomsShell } from "@/pages/session/atoms/atoms-shell"
import { AtomsRail } from "@/pages/session/atoms/atoms-rail"
import { AtomsStage } from "@/pages/session/atoms/atoms-stage"
import { AtomsTopbar } from "@/pages/session/atoms/atoms-topbar"
import { AtomsSide } from "@/pages/session/atoms/atoms-side"
import { AtomsComposer } from "@/pages/session/atoms/atoms-composer"
import { createAtomsState } from "@/pages/session/atoms/state"

const atoms = createAtomsState()

return (
  <div class="relative size-full overflow-hidden">
    <AtomsShell
      rail={<AtomsRail sync={sync} params={params} />}
      topbar={<AtomsTopbar info={info} atoms={atoms} />}
      stage={
        <AtomsStage
          timeline={
            <MessageTimeline
              actions={actions}
              renderedUserMessages={historyWindow.renderedUserMessages()}
              turnStart={historyWindow.turnStart()}
              historyMore={historyMore()}
              historyLoading={historyLoading()}
              onLoadEarlier={() => void historyWindow.loadAndReveal()}
            />
          }
        />
      }
      side={<AtomsSide atoms={atoms} />}
      composer={
        <SessionComposerRegion
          state={composer}
          ready={!store.deferRender && messagesReady()}
          centered={centered()}
          inputRef={(el) => {
            inputRef = el
          }}
          newSessionWorktree={newSessionWorktree()}
          onNewSessionWorktreeReset={() => setStore("newSessionWorktree", "main")}
          onSubmit={() => {
            comments.clear()
            resumeScroll()
          }}
          onResponseSubmit={resumeScroll}
          setPromptDockRef={(el) => {
            promptDock = el
          }}
        />
      }
    />
    <TerminalPanel />
  </div>
)
```

Implementation notes:

- Keep the existing session logic above the `return` in place.
- Do not reimplement history loading, revert, followup, or optimistic UI in the new shell components.
- The atoms components should receive already-derived props from `session.tsx`.

- [ ] **Step 4: Re-run the session layout e2e**

Run: `bun run test:e2e -- e2e/app/atoms-layout.spec.ts`

Expected: PASS. The page should render the atoms workbench layout while still loading a normal session.

- [ ] **Step 5: Commit**

```bash
git add webapp-previewer/src/pages/session.tsx webapp-previewer/src/pages/session/atoms webapp-previewer/e2e/app/atoms-layout.spec.ts
git commit -m "feat: recompose session page into atoms workbench"
```

### Task 4: Keep the Official Prompt Submit Chain Inside the Atoms Composer

**Files:**
- Modify: `webapp-previewer/src/pages/session/atoms/atoms-composer.tsx`
- Modify: `webapp-previewer/src/pages/session.tsx`
- Modify: `webapp-previewer/e2e/app/session.spec.ts`

- [ ] **Step 1: Write the failing prompt submission e2e**

```ts
import { test, expect } from "../fixtures"
import { promptSelector } from "../selectors"

test("submits a prompt from the atoms composer and shows the optimistic message", async ({ page, project }) => {
  await project.open()
  await page.locator(promptSelector).click()
  await page.keyboard.type("build a landing page with a pricing card")
  await page.keyboard.press("Enter")
  await expect(page.locator("text=build a landing page with a pricing card")).toBeVisible()
})
```

- [ ] **Step 2: Run the prompt e2e and verify it fails**

Run: `bun run test:e2e -- e2e/app/session.spec.ts`

Expected: FAIL if the atoms composer wrapper does not correctly surface the official prompt input and submit hooks.

- [ ] **Step 3: Wrap the official composer region instead of replacing its logic**

```tsx
// src/pages/session/atoms/atoms-composer.tsx
import { SessionComposerRegion } from "@/pages/session/composer"

export function AtomsComposer(props: Parameters<typeof SessionComposerRegion>[0]) {
  return (
    <div class="atoms-composer-shell">
      <div class="atoms-composer-inner">
        <SessionComposerRegion {...props} />
      </div>
    </div>
  )
}
```

```tsx
// inside src/pages/session.tsx
<AtomsComposer
  state={composer}
  ready={!store.deferRender && messagesReady()}
  centered={centered()}
  inputRef={(el) => {
    inputRef = el
  }}
  newSessionWorktree={newSessionWorktree()}
  onNewSessionWorktreeReset={() => setStore("newSessionWorktree", "main")}
  onSubmit={() => {
    comments.clear()
    resumeScroll()
  }}
  onResponseSubmit={resumeScroll}
  followup={
    params.id
      ? {
          queue: queueEnabled,
          items: followupDock(),
          sending: sendingFollowup(),
          edit: editingFollowup(),
          onQueue: queueFollowup,
          onAbort: () => {
            const id = params.id
            if (!id) return
            setFollowup("paused", id, true)
          },
          onSend: (id) => {
            void sendFollowup(params.id!, id, { manual: true })
          },
          onEdit: editFollowup,
          onEditLoaded: clearFollowupEdit,
        }
      : undefined
  }
  revert={
    rolled().length > 0
      ? {
          items: rolled(),
          restoring: restoring(),
          disabled: reverting(),
          onRestore: restore,
        }
      : undefined
  }
  setPromptDockRef={(el) => {
    promptDock = el
  }}
/>
```

Implementation notes:

- Do not fork `createPromptSubmit`.
- Do not copy prompt business logic into atoms-specific files.
- Treat the atoms composer as styling and framing around `SessionComposerRegion`.

- [ ] **Step 4: Re-run the prompt submission e2e**

Run: `bun run test:e2e -- e2e/app/session.spec.ts`

Expected: PASS. The optimistic user message should appear from the atoms composer path exactly as it does in the official session flow.

- [ ] **Step 5: Commit**

```bash
git add webapp-previewer/src/pages/session.tsx webapp-previewer/src/pages/session/atoms/atoms-composer.tsx webapp-previewer/e2e/app/session.spec.ts
git commit -m "feat: keep official prompt submit flow inside atoms composer"
```

### Task 5: Turn Preview Into a Right-Side Context Panel

**Files:**
- Modify: `webapp-previewer/src/webapp-previewer/use-webapp-preview.ts`
- Modify: `webapp-previewer/src/webapp-previewer/previewer.tsx`
- Create: `webapp-previewer/src/pages/session/atoms/atoms-preview.tsx`
- Modify: `webapp-previewer/src/pages/session/atoms/atoms-side.tsx`
- Create: `webapp-previewer/e2e/app/atoms-preview.spec.ts`

- [ ] **Step 1: Write the failing preview e2e**

```ts
import { test, expect } from "../fixtures"

test("opens the preview tab inside the atoms side panel after html output exists", async ({ project }) => {
  await project.open()
  const sessionID = await project.user("Create index.html with a heading that says Atoms Clone")
  await project.gotoSession(sessionID)

  await expect(page.getByRole("tab", { name: "Preview" })).toBeVisible()
  await page.getByRole("tab", { name: "Preview" }).click()
  await expect(page.locator("iframe[title='Web App Preview']")).toBeVisible()
})
```

- [ ] **Step 2: Run the preview e2e to verify it fails**

Run: `bun run test:e2e -- e2e/app/atoms-preview.spec.ts`

Expected: FAIL because preview currently lives in a `Portal` drawer, not in the session side panel tab set.

- [ ] **Step 3: Extract reusable preview content and embed it in the side panel**

```tsx
// src/pages/session/atoms/atoms-preview.tsx
import { Show } from "solid-js"
import { useWebAppPreview } from "@/webapp-previewer/use-webapp-preview"

export function AtomsPreview() {
  const preview = useWebAppPreview()
  return (
    <Show
      when={preview.state().previewUrl}
      fallback={<div class="atoms-empty">Generate or select an HTML file to preview.</div>}
    >
      <iframe
        src={preview.state().previewUrl!}
        title="Web App Preview"
        class="size-full rounded-[20px] border border-[var(--atoms-line)] bg-white"
      />
    </Show>
  )
}
```

```tsx
// src/pages/session/atoms/atoms-side.tsx
import { Switch, Match } from "solid-js"
import { AtomsPreview } from "./atoms-preview"
import type { AtomsView } from "./state"

const views: AtomsView[] = ["preview", "editor", "files", "inspect"]

function AtomsStub(props: { label: string }) {
  return <div class="atoms-empty">{props.label}</div>
}

export function AtomsSide(props: { atoms: { view: () => AtomsView; setView: (value: AtomsView) => void } }) {
  return (
    <div class="atoms-side-shell">
      <div class="atoms-side-tabs">
        {views.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={props.atoms.view() === item}
            onClick={() => props.atoms.setView(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <Switch>
        <Match when={props.atoms.view() === "preview"}>
          <AtomsPreview />
        </Match>
        <Match when={props.atoms.view() === "editor"}>
          <AtomsStub label="Editor view wiring lands in Task 6." />
        </Match>
        <Match when={props.atoms.view() === "files"}>
          <AtomsStub label="Files view wiring lands in Task 6." />
        </Match>
        <Match when={props.atoms.view() === "inspect"}>
          <AtomsStub label="Inspect view wiring lands in Task 6." />
        </Match>
      </Switch>
    </div>
  )
}
```

Implementation notes:

- Remove `Portal` usage from the live preview rendering path.
- Keep URL generation and HTML base-tag fixing logic inside `use-webapp-preview.ts`, but refactor out hard-coded defaults and debug logging.
- Make the hook depend on `sync.directory` and the active session file context, not a fixed fallback directory.

- [ ] **Step 4: Re-run the preview e2e**

Run: `bun run test:e2e -- e2e/app/atoms-preview.spec.ts`

Expected: PASS. The preview should render inside the right-side tabbed panel rather than a floating drawer.

- [ ] **Step 5: Commit**

```bash
git add webapp-previewer/src/webapp-previewer webapp-previewer/src/pages/session/atoms webapp-previewer/e2e/app/atoms-preview.spec.ts
git commit -m "feat: embed preview into atoms side panel"
```

### Task 6: Add Editor, Files, Inspect Views and Final Verification

**Files:**
- Modify: `webapp-previewer/src/pages/session/atoms/atoms-side.tsx`
- Modify: `webapp-previewer/src/pages/session.tsx`
- Modify: `webapp-previewer/src/index.css`
- Modify: `webapp-previewer/e2e/app/atoms-layout.spec.ts`

- [ ] **Step 1: Write the failing multi-view assertions**

```ts
import { test, expect } from "../fixtures"

test("switches between preview, files, and inspect views", async ({ project, page }) => {
  await project.open()
  const sessionID = await project.user("Create index.html and styles.css")
  await project.gotoSession(sessionID)

  await page.getByRole("tab", { name: "Files" }).click()
  await expect(page.getByText("index.html")).toBeVisible()

  await page.getByRole("tab", { name: "Inspect" }).click()
  await expect(page.getByText("Session")).toBeVisible()
})
```

- [ ] **Step 2: Run the atoms layout suite and verify the new assertions fail**

Run: `bun run test:e2e -- e2e/app/atoms-layout.spec.ts`

Expected: FAIL because only the preview pane exists or the side tabs are not wired to meaningful content yet.

- [ ] **Step 3: Implement the remaining side views using existing session data**

```tsx
// inside atoms-side.tsx
function FilesPane(props: { tabs: string[]; active?: string }) {
  return (
    <div class="atoms-list">
      <For each={props.tabs}>{(tab) => <button type="button">{tab.replace("file://", "")}</button>}</For>
    </div>
  )
}

function InspectPane(props: { sessionID?: string; status: string; count: number }) {
  return (
    <dl class="atoms-inspect">
      <div>
        <dt>Session</dt>
        <dd>{props.sessionID ?? "new"}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{props.status}</dd>
      </div>
      <div>
        <dt>Messages</dt>
        <dd>{props.count}</dd>
      </div>
    </dl>
  )
}
```

Implementation notes:

- `Files` should use the existing session/file tab state, not a second file list source.
- `Editor` can start by showing the active file content pane from the current file context.
- `Inspect` should surface session id, current status, selected view, and lightweight diagnostics already present in state.

- [ ] **Step 4: Run the full verification set**

Run: `bun typecheck`

Expected: PASS from `D:\github_repo\opencode\webapp-previewer`

Run: `bun run test:unit`

Expected: PASS with the new atoms state tests included.

Run: `bun run test:e2e -- e2e/app/atoms-bootstrap.spec.ts e2e/app/atoms-layout.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/session.spec.ts`

Expected: PASS. Bootstrap, layout, prompt submit, and preview flows should all work together.

- [ ] **Step 5: Commit**

```bash
git add webapp-previewer/src/pages/session.tsx webapp-previewer/src/pages/session/atoms webapp-previewer/src/index.css webapp-previewer/e2e/app
git commit -m "feat: finish atoms session side views"
```

## Self-Review

### Spec coverage

- Official frontend kernel reuse: covered by Task 1 and Task 4.
- Atoms-style workbench layout: covered by Task 2 and Task 3.
- Official backend / SDK / sync usage: covered by Task 1, Task 3, and Task 4.
- Right-side multi-view context panel: covered by Task 5 and Task 6.
- Preview integration: covered by Task 5.
- Testing and verification: covered by every task, with final full verification in Task 6.
- Documentation living under `webapp-previewer`: already satisfied by the saved plan and spec locations.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Every task names exact files.
- Every task includes executable commands.
- Every task includes at least one concrete code block.

### Type consistency

- The plan consistently uses `createAtomsState`, `AtomsShell`, `AtomsSide`, and `AtomsComposer`.
- Side view names are consistent across tasks: `preview`, `editor`, `files`, `inspect`.
- The plan keeps official prompt submission inside `SessionComposerRegion` / `createPromptSubmit` and does not introduce a second submit pipeline.
