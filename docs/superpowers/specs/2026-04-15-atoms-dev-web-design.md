# Atoms.dev 风格 Web 前端复刻设计记录

## 文档目的

这是一份持续更新的需求与理解文档，用来记录：

- 用户每一轮对话中提出的明确需求
- 当前对需求的理解和设计判断
- 已确认的设计决策
- 当前仍未定稿的点

用户要求：每次对话都更新这份文档，并提交到 git。

## 项目背景

- 仓库：`D:\github_repo\opencode`
- 当前工作重点目录：`D:\github_repo\opencode\webapp-previewer`
- 目标网站参考：`https://atoms.dev/chat/367a3a8730b3487f92a1a926fa7ef725`
- 后端约束：继续使用 OpenCode 官方后端，不改后端方案
- 前端参考：希望参考 `opencode/packages/app` 官方 Web 前端的设计、实现、后端调用方式

## 当前已确认的用户需求

1. 希望复刻一个类似 `atoms.dev` 的网站，界面效果参考提供的截图和示例链接。
2. 当前进度主要在 `webapp-previewer` 文件夹和 git 里。
3. 启动方式以 `webapp-previewer/QUICKSTART.md` 为准。
4. 当前任务不是只做静态页面，而是“修复现有问题，再完成完整任务”。
5. 后端继续沿用官方后端方案。
6. 前端应参考 `opencode/packages/app` 官方 Web 前端在以下方面的做法：
   - 页面组织
   - 实现方式
   - 调用后端的方式
7. 希望我把每次对话中的需求和我的理解写进文档，并持续更新。
8. 这份文档需要提交到 git。

## 当前理解

### 关于现状

- `webapp-previewer` 当前真正运行的入口是 `src/entry.tsx -> src/app.tsx`。
- 当前这个 `src/app.tsx` 是一个自定义的简化双栏原型，不是官方 `packages/app/src/app.tsx` 那套总装层。
- 这意味着当前页面虽然能快速做界面实验，但它并不天然具备官方 Web 前端的整体架构、状态组织和后端调用方式。

### 关于官方前端的参考对象

- `packages/app/src/entry.tsx`：官方 Web 前端浏览器入口启动器。
- `packages/app/src/app.tsx`：官方 Web 前端总装层，负责 providers、router、server connection、global sync 等基础设施。
- `packages/app/src/pages/session.tsx`：官方工作区核心页面，包含聊天、输入区、会话、侧栏等主要工作台能力。

### 关于目标方向

当前最符合用户目标的方案不是继续在 demo 上堆功能，而是：

**采用官方 Web 前端内核与后端调用方式，在其基础上实现一套 atoms.dev 风格的新工作台页面。**

这意味着：

- 保留或对齐官方的启动、provider、router、SDK、server、sync 机制
- 页面 UI 不直接照抄官方 session 页，而是重新实现一套更接近 atoms.dev 的工作台布局
- 后端仍然沿用官方后端

## 当前已确认的设计决策

### 决策 1：放弃旧的 A / B / C 选项

原因：旧选项主要是在“继续当前 demo”与“切回官方 session”之间选择，不足以表达“官方内核 + atoms 风格新页面”这个真实目标。

### 决策 2：采用新的方案 B

新的方案 B 含义：

**官方前端内核 + atoms 风格新页面**

用户已明确认可该方向。

### 决策 3：文档将持续维护

从本轮开始，这份文档作为长期设计记录维护；后续每次对话都需要补充：

- 新需求
- 新理解
- 新决策
- 仍待确认的点

### 决策 4：记录所有关键选择及其理由

用户新增要求：

- 每一步都要把理解写进文档
- 如果过程中有设计选择，需要把选择结果和选择理由一并写入文档

因此，后续文档不仅记录结论，也记录取舍依据。

## 当前设计状态

### 已获得确认的设计部分

#### 设计 1：整体架构方向

核心思路：

- `webapp-previewer` 不再以当前独立 demo 为核心
- 回到“官方 Web 前端内核 + atoms 风格页面壳”的结构
- 启动方式和基础设施对齐官方入口
- 页面层实现新的 atoms 风格工作台
- 后端完全继续官方后端

用户已确认认同这部分方向。

#### 设计 2：页面分区设计

页面采用 atoms 风格工作台分区，但底层能力仍来自官方前端体系：

- 左栏：会话与任务流
- 中央主舞台：当前工作对象
- 右栏：上下文与辅助视图
- 顶部工具条：工作区级控制
- 底部输入区：会话驱动入口

选择结果：

- 不再把页面当作简单双栏 demo
- 而是把它定义成一张正式工作台页面

选择理由：

- 更符合 atoms.dev 的产品形态
- 更容易和官方 session / sync / prompt / terminal 能力对接
- 后续演进时不会被当前 demo 结构束缚

用户已确认认同这部分方向。

#### 设计 3：组件边界与复用策略

本项目将采用“官方能力复用 + atoms 页面组件新建”的边界划分。

##### 直接复用或对齐的官方层

- 启动与 provider 结构：参考 `packages/app/src/entry.tsx` 与 `packages/app/src/app.tsx`
- 目录级上下文：参考 `packages/app/src/pages/directory-layout.tsx`
- 会话数据同步：参考 `packages/app/src/context/sync.tsx`
- SDK 客户端和事件：参考 `packages/app/src/context/sdk.tsx`
- 提交流程：参考 `packages/app/src/components/prompt-input/submit.ts`
- 输入组件能力：参考 `packages/app/src/components/prompt-input.tsx`

##### 新建的 atoms 风格页面组件

建议新增一个 atoms 工作台组件组，名称可按实现时再微调，但职责应固定：

- `atoms-shell`：整页布局与区域编排
- `atoms-rail`：左侧会话与任务流
- `atoms-stage`：中央主舞台
- `atoms-side`：右侧上下文面板
- `atoms-topbar`：顶部控制条
- `atoms-composer`：底部输入区包装层

##### 当前 demo 组件的处理方式

当前这些组件不再作为最终产品结构继续扩展：

- `webapp-previewer/src/app.tsx`
- `webapp-previewer/src/components/chat-panel.tsx`
- `webapp-previewer/src/components/right-panel.tsx`
- `webapp-previewer/src/components/editor-tab.tsx`
- `webapp-previewer/src/components/webapp-preview-tab.tsx`

选择结果：

- 它们降级为过渡参考，不作为正式工作台架构继续累加功能

选择理由：

- 这些组件大量依赖假数据和硬编码
- 继续在它们上面堆功能，会偏离“官方前端内核 + atoms 页面”的目标
- 继续保留它们只会增加两套页面结构并存的成本

##### 路由层选择

这里存在两个潜在方案：

1. 继续沿用当前 demo 根入口直接渲染一张独立页面
2. 回到官方路由结构，在 session 工作区下落 atoms 风格页面

选择结果：

- 选第 2 种

具体理解：

- 保留官方 `/:dir/session/:id?` 这条会话工作区路径
- 在该路径下使用 atoms 风格页面组件，而不是继续用独立 demo 根页

选择理由：

- 最符合“参考官方前端的设计 / 实现 / 后端调用方式”的目标
- 最容易复用官方 `DirectoryLayout -> SDKProvider -> SyncProvider -> session page` 这条主链路
- 后端交互与状态同步不需要再搭第二套体系

#### 设计 4：数据流与交互主链

##### 页面进入链路

页面进入时，沿用官方的大致顺序：

1. `entry` 挂载平台与基础 providers
2. `app` 挂载路由、server、global sync
3. `directory-layout` 负责按目录创建 `SDKProvider` 与 `SyncProvider`
4. atoms 风格 session 页面在 `/:dir/session/:id?` 路由下渲染

##### 会话数据流

atoms 页面不自己维护一套平行消息状态，而是直接消费：

- `useSync()` 中的 session / message / part / session_status / diff / todo
- `useSDK()` 中的 client 与 event

核心原则：

- 视觉层是新的
- 数据层尽量沿用官方

##### 提交流

用户从底部输入区发送请求时，复用官方 prompt submit 链路：

- 复用 prompt 上下文组装方式
- 复用 optimistic message 写入方式
- 复用 `session.promptAsync / session.command / session.shell`
- 复用 worktree 与新 session 创建的处理方式

选择结果：

- 输入区外观可以 atoms 化
- 但提交逻辑不新造

选择理由：

- 官方提交链路已经处理了 optimistic 更新、worktree 等复杂场景
- 这正是用户明确希望参考的“官方实现 / 官方调用后端方式”

##### 预览与编辑流

右侧上下文面板中的 `Preview / Editor / Files / Inspect` 等视图建议这样组织：

- `Preview`：使用官方后端文件服务和已有 preview 逻辑，展示 HTML 工件
- `Editor`：优先对接官方文件上下文和文件内容加载机制
- `Files`：展示当前工作目录和已打开文件
- `Inspect`：承接状态、运行信息、可能的元数据或 debug 视图

选择结果：

- 不把右侧面板限定为单一 iframe
- 而是做成多视图上下文面板

选择理由：

- 更接近 atoms 的工作台感
- 也更适合承接官方前端现有的文件、上下文、review 能力

#### 设计 5：错误处理、状态策略与测试策略

##### 错误处理

错误处理不采用“页面自己兜所有异常”的方式，而是优先复用官方已有的错误边界和 server 连接守卫：

- 复用 app 级 error boundary
- 复用 server 健康检查与连接失败页面
- 页面内部只负责工作台级空状态、加载态、局部失败提示

##### 状态策略

页面状态分三层：

1. 官方全局与目录级状态：server、sdk、sync、layout、prompt
2. atoms 页面局部状态：当前激活视图、选中面板、展示模式
3. 临时 UI 状态：hover、collapse、resizer、tab 高亮等

选择结果：

- 不复制官方业务状态到页面本地 store
- 页面本地只保留展示层状态

选择理由：

- 减少状态分叉
- 避免出现“官方 sync 一套、atoms 页面又一套”的双源问题

##### 测试策略

测试遵循仓库约束：

- 不从仓库根目录跑测试
- 类型检查从包目录运行 `bun typecheck`

建议的测试覆盖：

- 路由与 provider 接线测试
- atoms 页面布局状态测试
- prompt 提交到 optimistic message 的集成测试
- preview URL 与文件视图切换测试
- e2e 冒烟测试：会话页加载、发送输入、切换预览 / 编辑

选择结果：

- 优先做接线与集成验证，而不是只做纯样式测试

选择理由：

- 当前目标不是单纯复刻图片
- 而是要验证“官方前端方式 + 官方后端调用 + atoms 风格页面”是否真的打通

### 正在推进的下一部分

- 设计文档整理与用户审阅
- 在设计确认后进入实现计划阶段

## 当前未决事项

1. atoms 页面最终采用“替换现有 session 主视图”还是“在 session 路由下挂接新的 atoms 页面组件并保留旧页备用”的具体落地方式。
2. 右侧上下文面板初版是否一次性包含 `Preview / Editor / Files / Inspect` 四类视图，还是先交付其中三类。
3. 当前 preview 相关实现中，哪些逻辑适合直接迁移，哪些应重写以适配新页面结构。

## 对话更新记录

### 2026-04-15 第 1 次记录

用户提出：

- 希望复刻 `atoms.dev` 风格网站
- 参考截图与示例链接
- 现有工作主要在 `webapp-previewer`
- 希望修复问题并完成完整任务

我的判断：

- 当前仓库中存在“官方移植结构”和“独立 demo 原型”两条路线
- 需要先识别实际运行入口，再决定正确的设计路线

### 2026-04-15 第 2 次记录

用户通过可视化选择确认：不做最轻量静态复刻，而是要更像真实工作台。

我的判断：

- 需要放弃旧的简单分档方式，重新定义更贴近目标的方案分类

### 2026-04-15 第 3 次记录

用户进一步澄清：

- `opencode/packages/app` 才是官方 Web 前端代码位置
- 目标是参考官方前端“设计 / 实现 / 调用后端”的方式
- 后端仍采用官方后端

我的判断：

- 最合适的方向是“官方前端内核 + atoms 风格新页面”
- 不是继续当前 demo 堆功能，也不是简单给官方 session 换皮

### 2026-04-15 第 4 次记录

用户确认采用新的方案 B，并新增要求：

- 以后每次对话都更新这份文档
- 这份文档也要提交到 git

我的理解：

- 从现在开始，这份文档是持续维护的正式设计记录
- 每次对话都需要把新需求和新理解写入并提交

### 2026-04-15 第 5 次记录

用户确认：

- 认同页面分区设计
- 希望继续把后续设计完整做完
- 每一步都把理解写到文档中
- 如果有涉及选择，要把选择过程和选择理由写进文档

我的理解：

- 可以继续完成剩余设计部分
- 需要把组件边界、数据流、错误处理、测试策略都写入正式设计文档
- 需要把关键取舍显式记录，而不是只写最后结论
