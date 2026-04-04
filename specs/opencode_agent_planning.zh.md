# OpenCode 作为 Coding Agent 的任务拆解与 Planning 是怎么实现的

本文聚焦 OpenCode 在“规划（planning）”上的工程实现：它如何把“先规划、再执行”落地为 agent 模式、权限约束、系统提醒注入、以及 plan 文件工作流。

相关背景（Prompt 拼接与 system 注入）已在 [prompt_analysis.zh.md](file:///d:/github_repo/opencode/specs/prompt_analysis.zh.md) 总结，本文只覆盖 planning/任务拆解部分。

---

## 1. 核心结论（一句话）

OpenCode 的 planning 不是一个抽象的“思考步骤”，而是由 **plan/build 两个 primary agent + tool permission（只读/可写）+ plan_enter/plan_exit 工具（用户确认与模式切换）+ plan 文件落盘路径** 共同实现的一套“可执行工作流”。

---

## 2. 规划相关的 Agent 角色

Agent 定义集中在 [agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L51-L202)。

### 2.1 primary：build vs plan

- **build**：默认执行模式，允许 question、允许进入 plan（plan_enter）等；其余工具权限由默认规则 + 用户配置合并决定 [agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L77-L114)。
- **plan**：规划模式，关键点是“禁用 edit/write 等改动工具”，但允许对 plan 文件的有限编辑（以及 plan_exit）[agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L92-L114)。

planning 的“强约束”依赖 PermissionNext 规则集：同一个工具在 build 可用，但在 plan 直接 deny。

### 2.2 subagent：explore/general（任务拆解的执行单元）

- **explore**：专注于代码库探索（grep/glob/read/websearch 等），自带 PROMPT_EXPLORE [agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L130-L155)。
- **general**：通用研究/设计子 agent（默认禁用 todo），适合让模型从不同角度产出实现方案 [agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L115-L129)。

这些 subagent 通常通过 task 工具被“拉起”（见第 5 节）。

---

## 3. plan 文件落在哪里（planning 的“落盘载体”）

plan 文件路径由 [Session.plan](file:///d:/github_repo/opencode/packages/opencode/src/session/index.ts#L251-L256) 决定：

- 有 VCS（在 repo 中）→ `${worktree}/.opencode/plans/<timestamp>-<slug>.md`
- 无 VCS（临时目录）→ `${Global.Path.data}/plans/<timestamp>-<slug>.md`

这让 planning 具备两个重要属性：
- 可被版本控制（如果在 worktree 内，用户可自行选择是否提交）。
- 可在会话恢复/多轮对话中持续引用（路径稳定，且由系统提醒反复注入）。

---

## 4. plan_enter / plan_exit：规划工作流的“闸门”

planning 不是“模型自己决定开始/结束”，而是通过两个工具做显式的用户确认与模式切换：

- **plan_enter**：询问用户是否进入 plan 模式；同意后写入一条 synthetic user message，把 agent 切换到 `"plan"` [plan.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/plan.ts#L75-L130)。
- **plan_exit**：询问用户计划是否完成、是否切换回 build；同意后写入 synthetic user message，把 agent 切换到 `"build"` 并提示“现在可以编辑文件，执行 plan” [plan.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/plan.ts#L20-L73)。

本质上：这两个工具不直接“生成计划”，而是把 **用户选择** 固化为 **会话里的下一条 user 消息（agent=plan/build）**，从而驱动主循环按不同权限执行。

---

## 5. 任务拆解（planning）在主循环中的实际运行方式

主循环在 [SessionPrompt.loop](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L272-L722)：

### 5.1 进入 plan 时：插入 system-reminder，强制“只读 + 写 plan 文件”

insertReminders 会在进入 plan 模式时，向最后一条 user message 注入 `<system-reminder>`，其内容包括：
- 只允许只读动作，唯一可编辑文件是 plan 路径指向的 md 文件
- 推荐的分阶段 workflow（Phase 1~5）
- 强调最后必须调用 plan_exit 来请求批准

实现位置：[insertReminders](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1327-L1465)。

注意：这里存在两套逻辑：
- Flag 未开启时：只简单注入 PROMPT_PLAN / BUILD_SWITCH [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1331-L1355)
- Flag 开启时：注入“带 plan 文件路径 + workflow 的长提醒”（更接近 Claude Code 的 plan mode）[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1357-L1465)

### 5.2 从 plan → build：提醒执行 plan 文件

当从 plan agent 切换到非 plan agent，insertReminders 会检查 plan 文件是否存在，并在 user message 里附加 `BUILD_SWITCH` + plan 文件位置提示 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1360-L1377)。

### 5.3 任务拆解的“执行载体”：task 工具与 subtask part

OpenCode 支持两种方式把拆解后的子任务交给 subagent：

- **方式 A：模型主动调用 task 工具**  
  task 工具会创建/复用一个子 session，在子 session 内再次运行 SessionPrompt.prompt/loop，并把结果回填为 tool output（包含 task_id 可续跑）[task.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/task.ts#L27-L165)。

- **方式 B：命令触发 subtask（无模型决策）**  
  某些 command 可以生成只包含 `subtask` part 的 user message；主循环检测到 pending subtask 后会直接执行 TaskTool（相当于“代用户执行 task 工具”）[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L350-L522) 以及 subtask part 的创建逻辑 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1835-L1887)。

planning 提醒里写的“并行启动多个 explore agent”，对应的是“在一个 turn 里发出多个 task tool call / 多个 subtask”，从而在同一个循环内集中完成探索与汇总（并不要求真正的线程并行）。

---

## 6. 一个完整的 planning 流程（从用户视角到代码路径）

```text
用户提出复杂需求（默认 build）
  ->（可选）build 调用 plan_enter
     -> 写入 synthetic user message: agent=plan
  -> loop(): agent=plan
     -> insertReminders(): 注入 plan workflow + plan file 路径，只读约束
     -> 允许 read/grep/glob/task 等，只允许 edit/write 到 plan 文件
     ->（可选）用 task 启动 explore/general 子 agent，汇总后写 plan 文件
  -> plan_exit：请求用户确认
     -> 同意后写入 synthetic user message: agent=build
  -> loop(): agent=build
     -> insertReminders(): 注入“执行 plan 文件”的提醒
     -> 开始调用 edit/write/apply_patch 等实现变更
```

---

## 7. planning 的可配置点（影响行为的开关）

- **实验性 plan mode**：insertReminders 的“新 plan 工作流”受 `Flag.OPENCODE_EXPERIMENTAL_PLAN_MODE` 控制 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1331-L1465)。
- **plan_enter/plan_exit 工具是否可用**：同时要求 `Flag.OPENCODE_EXPERIMENTAL_PLAN_MODE` 且 client=cli [registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L94-L120)。
- **agent.steps（最大 agentic steps）**：用于限制循环步数，最后一步会强制禁用工具（见多轮逻辑文档）[agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L44-L45)。

