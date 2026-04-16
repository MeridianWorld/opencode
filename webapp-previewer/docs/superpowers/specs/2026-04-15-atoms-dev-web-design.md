# Atoms.dev 风格 Web 前端复刻设计记录

## 文档目的

这是一份持续更新的需求与设计记录，用来同步以下信息：

- 用户每次对话里提出的明确需求
- 我对当前任务的理解
- 已做出的设计选择，以及为什么这样选
- 当前还没落地、但后续实现必须处理的点

已确认的文档约束：

- 每次对话都更新这份文档
- 文档必须提交到 git
- 文档必须放在 `D:\github_repo\opencode\webapp-previewer` 路径内，不能写到这个路径外

## 项目背景

- 仓库根目录：`D:\github_repo\opencode`
- 当前主要开发目录：`D:\github_repo\opencode\webapp-previewer`
- 目标参考站点：[atoms.dev](https://atoms.dev/chat/367a3a8730b3487f92a1a926fa7ef725)
- 视觉参考：用户提供的两张本地截图
- 后端约束：继续使用官方 `packages/opencode` 后端，不改后端方案
- 前端参考：优先参考 `packages/app` 官方 Web 前端的设计方式、实现方式、以及调用后端的方式

## 已确认的用户需求

1. 目标不是做一张静态图，而是复刻一个类似 `atoms.dev` 的可运行网站工作台。
2. 现有工作基础主要在 `webapp-previewer` 文件夹和当前 git 工作树里。
3. 启动方式以 `webapp-previewer/QUICKSTART.md` 为准。
4. 当前任务不是只做新页面，而是要先修复当前问题，再完成完整任务。
5. 后端继续沿用官方后端方案。
6. 前端要尽量参考 `opencode/packages/app` 官方 Web 前端在以下方面的做法：
   - 页面组织方式
   - 组件与状态组织方式
   - 调用官方后端与同步数据的方式
7. 希望把每次需求和我的理解持续写入文档。
8. 如果中间存在设计选择，也要把选择结果和选择理由写进文档。
9. 这份文档必须提交到 git。
10. 后续所有这类文档都必须放在 `webapp-previewer` 路径内。
11. 用户已经查看过这份设计文档的方向，并确认“可以”。
12. 在设计确认后，需要继续往下推进，不停在概念讨论阶段。

## 当前代码现状

### 当前实际入口

- 当前最新状态：
  - `webapp-previewer/src/entry.tsx` 已切换为官方 web 入口结构
  - `webapp-previewer/src/app.tsx` 已切换为官方 app shell/provider/router 结构
  - live 入口不再直接使用 `ChatPanel + RightPanel` 这套 demo 骨架

补充说明：

- 在开始实现前，这里确实还是一个自定义双栏 demo
- 当前这一步已经完成“入口切回官方链路”的首轮落地

### 已经存在、可以复用的官方风格基础设施

`webapp-previewer` 里其实已经有大量官方 Web 前端风格的代码，包含：

- `src/context/sdk.tsx`
- `src/context/sync.tsx`
- `src/context/global-sync.tsx`
- `src/context/file.tsx`
- `src/context/prompt.tsx`
- `src/pages/layout.tsx`
- `src/pages/directory-layout.tsx`
- `src/pages/session.tsx`
- `src/pages/session/*`

这说明当前项目并不是“从零开始”，而是：

- 启动入口层偏向 demo
- session 与上下文层已经更接近官方 Web 前端体系

### 现有 preview 相关实现

当前已有一套 Web 预览实验实现：

- `src/webapp-previewer/previewer.tsx`
- `src/webapp-previewer/use-webapp-preview.ts`
- `src/webapp-previewer/use-webapp-preview-simple.ts`

这套实现已经覆盖了一部分能力：

- 检测 HTML 文件
- 生成 `/view/...` 预览 URL
- 自动预览
- 设备模式切换

但它当前的问题也很明确：

- UI 是通过 `Portal` 单独塞到页面右侧，仍然是“外挂式预览抽屉”
- 状态和页面主体的关系比较松散
- 存在调试日志、硬编码目录、实验性实现痕迹
- 还不是 atoms 风格的右侧多视图上下文面板

## 我当前的理解

最符合用户目标的方向，不是继续堆当前 demo，也不是只给官方 session 换一层皮，而是：

**采用官方 Web 前端内核与后端调用方式，在 `webapp-previewer` 中实现一套 atoms.dev 风格的新工作台页面。**

这个理解包含四层含义：

1. 启动链路和 provider 链路尽量对齐官方 `packages/app`
2. 路由继续保留官方会话工作区语义，而不是做一个脱离路由体系的独立 demo
3. UI 视觉和工作台布局向 `atoms.dev` 靠拢
4. 数据流、同步流、prompt 提交流仍尽量复用官方现有能力

## 已确认的设计决策

### 决策 1：放弃“继续加固独立 demo”这条主路线

选择结果：

- 不再把 `src/app.tsx + ChatPanel + RightPanel` 这套结构当作最终产品架构

选择理由：

- 它偏离官方 Web 前端的启动与状态链路
- 越在这套结构上叠功能，后续越难和官方 `sync / sdk / prompt submit` 对齐
- 它更适合验证局部视觉，不适合作为最终工作台骨架

### 决策 2：采用“官方前端内核 + atoms 风格新页面”

选择结果：

- 最终路线采用新的方案 B：官方前端内核 + atoms 风格新页面

选择理由：

- 这最符合用户“参考官方前端的设计 / 实现 / 调后端方式”的原始诉求
- 可以最大化复用现有 `context`、`sync`、`sdk`、`prompt-input`、`session` 逻辑
- 也最容易在不改官方后端的前提下做出接近 `atoms.dev` 的体验

### 决策 3：保留官方会话路由语义

选择结果：

- 继续沿用 `/:dir/session/:id?` 这条会话路由

选择理由：

- 这是官方 Web 前端真实的会话工作区路径
- `directory-layout -> SDKProvider -> SyncProvider -> session page` 这条链路已经存在
- 保留它能让 session 创建、切换、同步、回填都继续遵守官方模式

### 决策 4：复用官方数据流与提交流，不复制一套业务状态

选择结果：

- session 消息、diff、todo、status 继续直接消费 `useSync()`
- SDK 客户端和事件继续通过 `useSDK()` 使用
- prompt 提交逻辑继续复用 `prompt-input/submit.ts`

选择理由：

- 官方实现已经处理了 optimistic message、worktree、command、shell、revert、followup 等复杂情况
- 如果再做一套平行 store，只会制造状态分叉和后续维护成本
- 用户明确希望参考官方“如何调后端”，这正是最该复用的部分

### 决策 5：右侧区域做成多视图上下文面板，而不是单一 iframe

选择结果：

- 右侧上下文面板的初版定位为多视图容器，至少覆盖：
  - `Preview`
  - `Editor`
  - `Files`
  - `Inspect`

选择理由：

- 这比“纯预览抽屉”更接近 `atoms.dev` 工作台感
- 也更容易承接官方前端已有的文件、diff、上下文与调试信息
- 后续能自然扩展，而不是把右侧硬绑成单一 iframe

### 决策 6：当前 preview 逻辑按“能力迁移、界面重写”处理

选择结果：

- 保留现有 preview 实现中的可迁移能力
- 重写其展示方式，使其成为 session 页面内部右侧面板的一部分

可迁移能力：

- 识别 HTML 预览文件
- 生成基于 `/view/...` 的预览 URL
- 设备模式切换

需要重写的部分：

- `Portal` 式外挂布局
- 调试日志
- 硬编码默认目录
- 与页面主体松耦合的状态组织

选择理由：

- 现在这套 preview 不是完全没用，但也不适合直接作为最终 UI
- “迁移能力、重写呈现层”成本最低，也最符合当前项目现状

### 决策 7：文档与计划统一放在 `webapp-previewer/docs/superpowers`

选择结果：

- 设计记录保存在：
  - `webapp-previewer/docs/superpowers/specs/2026-04-15-atoms-dev-web-design.md`
- 实现计划保存在：
  - `webapp-previewer/docs/superpowers/plans/2026-04-15-atoms-webapp-implementation.md`

选择理由：

- 这是用户新增的明确要求
- 这样文档与开发目录保持一致，不会散落在仓库根目录

## 当前推荐的页面分区

### 左侧 Rail

职责：

- 会话列表
- 工作流/任务流入口
- 与当前 session 相关的导航锚点

### 中央 Stage

职责：

- 消息主时间线
- 当前工作对象的主视图
- 与 session 同步直接相关的交互主体

### 顶部 Topbar

职责：

- 会话标题
- 当前模式与上下文切换
- 与右侧面板联动的全局操作

### 底部 Composer

职责：

- atoms 风格输入区外壳
- 内部继续复用官方 prompt submit 逻辑

### 右侧 Context Side

职责：

- `Preview / Editor / Files / Inspect` 多视图切换
- 展示当前 session 产物、文件、预览与辅助信息

## 当前文件边界判断

### 继续作为主链路使用的文件

- `webapp-previewer/src/entry.tsx`
- `webapp-previewer/src/app.tsx`
- `webapp-previewer/src/pages/layout.tsx`
- `webapp-previewer/src/pages/directory-layout.tsx`
- `webapp-previewer/src/pages/session.tsx`
- `webapp-previewer/src/context/sdk.tsx`
- `webapp-previewer/src/context/sync.tsx`
- `webapp-previewer/src/components/prompt-input.tsx`
- `webapp-previewer/src/components/prompt-input/submit.ts`

### 作为“可迁移能力源”的文件

- `webapp-previewer/src/webapp-previewer/previewer.tsx`
- `webapp-previewer/src/webapp-previewer/use-webapp-preview.ts`
- `webapp-previewer/src/webapp-previewer/types.ts`

### 降级为旧 demo 参考、不再作为最终架构继续堆功能的文件

- `webapp-previewer/src/app.tsx` 当前 demo 版本本身
- `webapp-previewer/src/components/chat-panel.tsx`
- `webapp-previewer/src/components/right-panel.tsx`
- `webapp-previewer/src/components/editor-tab.tsx`
- `webapp-previewer/src/components/webapp-preview-tab.tsx`

说明：

- 这些文件不一定立即删除
- 但不会再作为主工作台架构继续扩展

## 当前还未完全落地的实现问题

1. `src/pages/session.tsx` 的 atoms 化重组，最终是“整页替换内部布局”，还是“局部包裹旧 session 子块”，实现时仍要进一步压实。
2. 右侧多视图面板的第一版是否一次性完整交付 `Preview / Editor / Files / Inspect` 四类视图，还是先以三类可用视图起步，需要在实现时按复杂度收敛。
3. 现有 preview hook 中哪些逻辑直接保留，哪些逻辑需要改造成更纯粹的可测试函数，落代码时要按单测可写性来切。
4. 当前工作树里存在一些未跟踪实验文件，实现时必须避免误删或误回滚用户已有工作。

## 当前阶段结论

设计阶段已经足够明确，可以进入实现计划和实际开发阶段。

下一阶段原则：

- 先把入口与路由骨架切回官方内核
- 再在 session 页面里完成 atoms 风格工作台重组
- 最后把右侧上下文面板与 preview/editor/files/inspect 接上

## 最新实现进展

### 已完成

- `webapp-previewer/src/entry.tsx` 已替换为官方 web 入口结构
- `webapp-previewer/src/app.tsx` 已替换为官方 app/provider/router 结构
- 新增 e2e：
  - `webapp-previewer/e2e/app/atoms-bootstrap.spec.ts`
- 这条 bootstrap e2e 已通过，用来证明当前页面不再落回旧 demo 根页
- `bun typecheck` 已在 `webapp-previewer` 下恢复通过

### 实现阶段中暴露并修复的基础问题

- `webapp-previewer/e2e/fixtures.ts` 里引用 `llm-server` 的相对路径写错，缺少 `packages/` 这一层
- `webapp-previewer/e2e/backend.ts` 里定位仓库根目录时多退了一层，导致 `cwd` 指向不存在的目录
- 同一个 `backend.ts` 在 Windows 下还需要显式通过 shell 调起 `bun run ...`
- `webapp-previewer/src/custom-elements.d.ts` 处于损坏状态
- `webapp-previewer/src/types.d.ts` 存在无效声明语法
- `webapp-previewer/src/webapp-previewer/use-webapp-preview.ts` 依赖了当前 `useSDK()` 中并不存在的属性，已改成只依赖现有 `sync` 数据

### 当前判断

- 第一阶段“恢复官方 app shell”已经落地
- 下一阶段可以继续推进 atoms 风格 session 工作台拆分
- 现有 previewer 仍是旧实验 UI，但已经不再阻塞编译与入口验证

## 对话更新记录

### 2026-04-15 第 1 次记录

用户提出：

- 想复刻 `atoms.dev` 风格网站
- 提供了截图和示例链接
- 当前工作集中在 `webapp-previewer`
- 希望先修复问题，再完成完整任务

我的理解：

- 需要先确认当前真正运行的是哪条前端链路
- 不能直接把任务误判为“只做一个静态页面”

### 2026-04-15 第 2 次记录

用户通过可视化选择表达出：目标不是最轻量静态复刻，而是更像真实工作台。

我的理解：

- 需要放弃“简单 demo 延长线”的思路
- 重新定义更贴近最终目标的方案分类

### 2026-04-15 第 3 次记录

用户进一步澄清：

- `opencode/packages/app` 才是官方 Web 前端代码位置
- 希望参考官方前端的设计、实现、后端调用方式
- 后端仍沿用官方方案

我的理解：

- 最合适的方向是“官方前端内核 + atoms 风格新页面”
- 不是继续堆当前 demo，也不是只给官方 session 换皮

### 2026-04-15 第 4 次记录

用户确认采用新的方案 B，并新增要求：

- 以后每次对话都更新这份文档
- 文档也要提交到 git

我的理解：

- 这份文档从现在起就是正式的长期设计记录
- 后续每一轮对话都要把新增需求、理解和选择写入其中

### 2026-04-15 第 5 次记录

用户确认：

- 认同页面分区设计
- 希望我继续把后续设计做完整
- 每一步都把理解写入文档
- 如果有选择，也要记录选择过程和理由

我的理解：

- 需要把组件边界、数据流、错误处理、测试策略一并补齐
- 文档不只是写结论，还要写取舍依据

### 2026-04-15 第 6 次记录

用户新增要求：

- 当前主要在 `webapp-previewer` 路径下开发
- 文档也应该都写在这个路径里面，不要写到外面

我的处理与选择：

- 将设计文档位置统一迁入 `webapp-previewer/docs/superpowers/...`

选择理由：

- 这是明确的路径约束
- 也能让文档与实现代码在同一开发范围内维护

### 2026-04-15 第 7 次记录

用户查看文档后确认：

- 文档方向“可以”

我的理解：

- 设计方向已经获得确认
- 可以从设计收敛转入实现计划

### 2026-04-15 第 8 次记录

用户要求继续推进。

我的处理与选择：

- 进入实现计划编写阶段
- 使用 `writing-plans` 技能，把已确认设计整理成可执行的实现计划

选择理由：

- 任务已经跨越入口、路由、session、preview、测试多个子系统
- 先写清楚文件边界、测试路径和提交节奏，能避免后续实现跑偏

### 2026-04-15 第 9 次记录

进入实现后，我先按 TDD 补了 `atoms-bootstrap` 这条 e2e，用来锁定：

- 页面必须通过官方 app shell 打开
- 页面必须落在官方 session 路由，而不是旧 demo 根页

在这一步暴露出的理解：

- 当前失败不只是“入口还是旧 demo”
- `webapp-previewer` 现有 e2e 基础设施本身也有路径和 Windows 进程启动问题

### 2026-04-15 第 10 次记录

我在实现阶段做出的新增选择：

- 先修复 e2e 基础设施，再继续验证入口切换
- 先把 `src/app.tsx / src/entry.tsx` 切回官方结构，再继续 atoms 页面拆分
- 顺手修复阻塞 `bun typecheck` 的损坏声明文件和 previewer 类型错误

选择理由：

- 如果不先修复 e2e 与 typecheck，后续每一轮实现都会失去可验证性
- 用户原始需求就是“先修复问题，再完成完整任务”，这些基础问题正属于必须先清掉的阻塞
### 2026-04-15 Record 13
Additional validation added after the first atoms-shell pass:
- Added `e2e/app/atoms-preview.spec.ts`
- Tightened the preview assertion to scope inside `data-component="atoms-preview"` after finding a duplicate `Files` button in the wider page shell

Why this mattered:
- The failure was in the locator, not in the implementation
- Keeping the selector scoped avoids false negatives while still proving the preview workspace is rendered

### 2026-04-15 Record 11
User instruction continued:
- Keep working inside `webapp-previewer`
- Continue implementing instead of stopping at the first bootstrap fix
- Keep writing each new understanding and decision into this document

My understanding:
- Restoring the official app shell was only phase one
- The next milestone is replacing the old session composition with an atoms-style workspace shell
- The shell must preserve official session behavior instead of forking business logic

Implementation choices made in this step:
- Commit phase one separately first: `feat: restore official webapp shell bootstrap` (`16644067a`)
- Add a local red/green test for atoms state before creating new state
- Add a layout-level red/green e2e before swapping the session page shell
- Recompose the right workspace instead of directly embedding the old `SessionSidePanel`

Why this choice:
- The old side panel computes width from the previous two-column layout and does not fit a new atoms-style three-column shell cleanly
- A lighter recomposition lets us keep official file and review primitives while changing the presentation layer

### 2026-04-15 Record 12
What was implemented:
- Added `src/pages/session/atoms/state.ts`
- Added `src/pages/session/atoms/state.test.ts`
- Added atoms shell components under `src/pages/session/atoms/`
- Replaced the live session-page layout tree in `src/pages/session.tsx` with:
  - conversation stage
  - atoms rail
  - atoms topbar
  - atoms side workspace
  - atoms composer wrapper
- Added inline preview workspace component backed by the existing preview hook
- Added `e2e/app/atoms-layout.spec.ts`
- Added atoms theme variables to `src/index.css`

Validation completed in this step:
- `bun test --preload ./happydom.ts ./src/pages/session/atoms/state.test.ts`
- `bun typecheck`
- `bunx playwright test e2e/app/atoms-layout.spec.ts --reporter=line`

Current status after this step:
- Official shell bootstrap is in place and committed
- Atoms-style session shell now renders around the routed session
- The session still uses official prompt, timeline, review, and file behavior internally
- The global opencode chrome is still present around the session route, so matching the full atoms.dev site frame is still a remaining task
### 2026-04-16 Record 14
User request:
- Start the current `webapp-previewer` implementation so it can be inspected in the browser

My understanding:
- The immediate goal is not a new code change, but launching the current backend and frontend together
- I should use the documented local start flow under `webapp-previewer`, verify the URLs respond, and then hand over the local address

Choice made:
- Follow the existing `QUICKSTART.md` flow:
  - backend on `http://localhost:4096`
  - frontend on `http://localhost:5173`
- Start them as detached local processes so the app stays up after this message

### 2026-04-16 Record 15
User feedback after seeing the running page:
- The interface looks inconsistent because the official opencode shell is dark while the new atoms workspace is still bright and pale
- The workspace tabs are unreliable: some feel unclickable and some appear to error when switching
- A Chrome DevTools MCP inspection path was suggested

My understanding:
- The visual problem is not only "needs polish"; the current atoms theme is structurally wrong because `src/index.css` applies a light atoms palette at the global root level
- That global palette leaks into the routed session shell and clashes with the official opencode dark theme
- The workspace tab issue is most likely caused by our atoms tab state still driving the official `reviewPanel` and `fileTree` layout state, which means one user action is trying to control two shells at once
- In this session there is no available Chrome DevTools MCP resource, so the safest debugging path is local code inspection plus regression tests

Choices made in this step:
- Add a dedicated draft-screen regression test: `webapp-previewer/e2e/app/atoms-workspace-tabs.spec.ts`
- Run that test at a desktop viewport close to the user's screenshot size so the regression check matches the reported interaction surface
- Scope atoms theme tokens under `[data-component="atoms-shell"]` instead of `:root`
- Remap the atoms palette to official opencode theme tokens (`--background-base`, `--surface-raised-*`, `--text-*`, `--border-base`) instead of keeping the earlier pale beige palette
- Stop using atoms tab switches to open and close the official `reviewPanel` and `fileTree`; keep only the atoms-local view state and load file-tree data directly when the atoms workspace is on `files` or `editor`

Why this choice:
- Scoping the theme fixes the "black shell + white insert" mismatch at the source instead of repainting isolated components one by one
- Reusing the official theme tokens keeps the new workspace visually aligned with opencode while still allowing an atoms-like information layout
- Decoupling tab clicks from the official outer layout removes a hidden source of state conflicts and better matches the intended product model: the atoms workspace should manage its own right-side surface
- The new e2e provides a concrete regression guard for tab switching on the new-session screen, which is exactly where the user reported instability

Validation completed in this step:
- `bun typecheck`
- `bunx playwright test e2e/app/atoms-layout.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts e2e/app/session.spec.ts --reporter=line`

### 2026-04-16 Record 16
New user feedback after the dark-theme/tab fix:
- On the currently running `new session` page, all buttons still appear unclickable in the real UI
- A screenshot was provided showing the latest dark atoms shell, so this is not an older pale build

My understanding:
- I could not reproduce the complete failure in automated Chromium against the same local route; direct hit-testing on the visible buttons resolved to the buttons themselves and scripted clicks did switch the atoms workspace
- That means the issue is likely environment-sensitive rather than a missing `onClick` binding
- The most suspicious implementation difference is the `display: contents` wrapper inside `src/pages/session/atoms/atoms-shell.tsx`
- `display: contents` is not used in the surrounding official app shell, and it is known to be fragile for hit-testing and interactivity in some WebView / desktop-shell contexts even when normal Chromium automation still passes

Choice made in this step:
- Remove the `display: contents` wrapper from `AtomsShell`
- Render the three atoms columns as normal positioned grid children instead
- Keep the fix small and avoid bundling unrelated behavioral changes

Why this choice:
- It directly targets a browser/WebView-specific interaction risk introduced by the atoms shell implementation itself
- It is a safer layout pattern and aligns better with how the official app shell composes interactive regions
- The automated tests already covered the expected tab behavior, so this change improves runtime robustness without changing the intended UX contract

Validation completed in this step:
- `bun typecheck`
- `bunx playwright test e2e/app/atoms-layout.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts --reporter=line`

### 2026-04-16 Record 17
New user-reported error:
- Clicking `Editor` or `Files` could crash the page with:
  - `Error: [kobalte]: useTabsContext must be used within a Tabs component`
- The user also asked that every later error discovery, understanding, and handling step be appended to this document as part of the working log

My understanding after root-cause inspection:
- The earlier atoms workspace tab regression only covered the empty editor state, so it did not open a real file tab and therefore missed the failing path
- The actual crash happens only after the atoms workspace has an active file tab
- `src/pages/session/file-tabs.tsx` exports `FileTabContent`, and that component returns `Tabs.Content`
- In the official `session-side-panel` implementation, `FileTabContent` is always rendered inside a real `Tabs` root
- In the atoms workspace implementation inside `src/pages/session.tsx`, I had been rendering `FileTabContent` directly in the editor pane without a surrounding `Tabs` provider
- That mismatch is the direct cause of the Kobalte context error

Choices made in this step:
- Tighten `e2e/app/atoms-workspace-tabs.spec.ts` so it:
  - opens the `Files` workspace
  - switches the tree to `All`
  - opens the seeded `README.md` file from the workspace tree
  - then switches across atoms workspace views while asserting the shell stays healthy
- Use that stronger test to verify a real red state before changing production code
- Fix the editor pane with the smallest structural change:
  - wrap the atoms editor content area in `@opencode-ai/ui/tabs`
  - keep an `empty` content state for the no-file case
  - render each `FileTabContent` under that `Tabs` root so the official file viewer keeps the context it expects
- Keep the custom atoms file-chip buttons as the visible tab controls, instead of rewriting the whole editor pane to the full official side-panel layout

Why this choice:
- It preserves the official opencode file-view implementation instead of forking it
- It fixes the exact root cause instead of masking the crash with conditional rendering or error swallowing
- It matches the product direction already agreed in this project: atoms-style presentation outside, official session/file behavior inside

Validation completed in this step:
- Red verification first:
  - `bunx playwright test e2e/app/atoms-workspace-tabs.spec.ts --reporter=json`
  - confirmed the failing route and captured the same `useTabsContext` error in the test output
- Green verification after the fix:
  - `bunx playwright test e2e/app/atoms-workspace-tabs.spec.ts --reporter=json`

### 2026-04-16 Record 18
New user instruction:
- `D:\github_repo\opencode\test-html` is a real web project that can be used to validate whether `webapp-previewer` features behave correctly

Additional verification finding:
- Running the three atoms Playwright specs together with the default worker count produced a separate test-harness failure
- All three failures stopped in `waitSession()` before entering the atoms workspace checks, which means that run was not evidence of a regression in the tabs fix itself
- Re-running the same atoms suite serially succeeded end-to-end

My understanding:
- `test-html` should become the stable feature-validation sample project for preview, file tree, editor, and inspect flows, because it is more realistic than the minimal temp workspace used by the current draft-session tests
- The current atoms tab fix is functionally sound based on the red-to-green targeted regression and the serial suite pass
- The parallel Playwright timeout is a separate reliability issue in the e2e harness or local startup flow and should be tracked independently from the UI bug

Choices made in this step:
- Record `test-html` as the preferred local sample app for future validation work
- Keep the current functional verification focused on:
  - `bun typecheck`
  - the atoms Playwright subset
- Treat the parallel `waitSession()` timeout as an environment/test-orchestration issue, not as proof that the tabs fix regressed the atoms shell
- Re-run the atoms suite serially with `--workers=1` to verify the actual product behavior deterministically

Why this choice:
- It separates product debugging from harness debugging, which keeps later troubleshooting much clearer
- It gives the project a concrete, reusable sample workspace for future preview/editor/files validation
- It still verifies the current bug fix thoroughly without expanding scope into unrelated e2e infrastructure work

Validation completed in this step:
- `bun typecheck`
- `bunx playwright test e2e/app/atoms-layout.spec.ts e2e/app/atoms-preview.spec.ts e2e/app/atoms-workspace-tabs.spec.ts --workers=1 --reporter=json`
