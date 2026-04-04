# OpenCode 的工具调用（Tool Use）是怎么实现的

本文总结 OpenCode 从“工具定义”到“模型发起 tool call”再到“执行并把结果写回会话”的完整链路，重点覆盖：Tool 规范、ToolRegistry 聚合、权限过滤、AI SDK 工具装配、流式执行与结果落盘。

---

## 1. 工具在 OpenCode 里的抽象：Tool.Info

OpenCode 内部把每个工具抽象为 `Tool.Info`：
- `id`：工具名（例如 read/grep/edit/task）
- `init(ctx?)`：初始化，返回 description、zod parameters、execute 函数

定义与统一封装在 [tool.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/tool.ts#L7-L88)：
- 执行前用 zod 校验参数（可选 formatValidationError）
- 默认对 tool output 做 Truncate.output 截断，避免超长输出污染上下文

---

## 2. 工具说明书（prompt）在哪里：*.txt

多数工具的 `description` 来自同目录下的 `*.txt`：
- 例如 Read 工具 `description` 读取 [read.txt](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.txt)，并在 [read.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.ts#L17-L24) 注入到 Tool.define。

这意味着：OpenCode 的“工具使用规范（如何读文件、如何 grep、如何提问）”大部分都写在 `tool/*.txt`，并作为工具描述传给模型。

---

## 3. ToolRegistry：工具集合怎么被组装出来

ToolRegistry 负责把工具集合（内置 + 插件 + 自定义脚本工具）合并成最终清单。

实现见 [registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L31-L167)：

### 3.1 内置工具

`all()` 返回固定顺序的内置工具集合，并受 feature flag 影响：
- 基础：bash/read/glob/grep/edit/write/task/webfetch/todowrite/websearch/codesearch/skill/apply_patch…
- LSP、Batch、PlanEnter/PlanExit 等为可选

### 3.2 “模型适配”的工具选择：apply_patch vs edit/write

ToolRegistry 会根据模型决定是否使用 `apply_patch`（更接近 Codex 风格）：
- 如果是支持的 gpt-* 且非 gpt-4/oss → 启用 apply_patch，并禁用 edit/write
- 否则禁用 apply_patch，启用 edit/write

逻辑见 [registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L142-L147)。

### 3.3 自定义工具与插件工具

ToolRegistry 会扫描配置目录下 `{tool,tools}/*.{js,ts}` 加载 tool definition，并支持插件注入：
- 脚本扫描与 fromPlugin 包装：[registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L34-L82)
- 插件列表合并：[registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L50-L55)

fromPlugin 会把插件输出做 Truncate.output，保持与内置工具一致的输出约束 [registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L60-L81)。

---

## 4. 从 ToolRegistry 到“模型可调用工具”：SessionPrompt.resolveTools

SessionPrompt.resolveTools 把 ToolRegistry 返回的 `Tool.Info[]` 转换为 AI SDK 的 `Tool`（包含 description + JSON schema + execute），并注入统一的执行逻辑：
- zod schema → JSON schema（ProviderTransform.schema 用于做 provider 兼容）  
- tool.execute wrapper：加 plugin hooks、构建 ctx、写入 tool part 元信息、做 permission ask

实现位置：[prompt.ts:resolveTools](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L731-L912)。

此外它还会把 MCP.tools() 合并进来，并对 MCP 工具做同样的 wrapper（包括 permission ask 与 output 截断）[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L817-L909)。

---

## 5. 权限与“工具可用性”过滤发生在哪里

OpenCode 的工具权限不是只靠 prompt，而是运行时强制检查：

### 5.1 每个工具执行时：ctx.ask

工具实现会显式调用 `ctx.ask(...)` 请求 PermissionNext 决策，例如 Read 工具 [read.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.ts#L42-L47)、TodoWrite 工具 [todo.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/todo.ts#L12-L18)。

### 5.2 给模型“暴露哪些工具”：LLM.resolveTools

即使工具存在，也可能不会被传给模型：
- 结合 agent.permission（PermissionNext.disabled）与 user.tools 覆盖，把禁用工具从 tool set 中删除

实现位置：[llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L262-L270)。

---

## 6. 工具调用的执行与落盘：LLM.stream + SessionProcessor

### 6.1 LLM.stream：把 tools 交给 AI SDK 处理 tool-call

LLM.stream 最终调用 `streamText`（AI SDK），并把：
- `system messages + conversation messages`
- `tools`（已过滤）
- `activeTools`、`toolChoice`、providerOptions

一起传入 [llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L46-L260)。

它还提供：
- tool call 修复（大小写修复/无效工具兜底为 invalid）[llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L182-L202)
- LiteLLM/代理兼容：当历史含 tool calls 但本轮无工具时，注入 `_noop` dummy tool [llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L154-L174)

### 6.2 SessionProcessor：消费 stream.fullStream 事件并写入 message parts

SessionProcessor.process 逐条消费 `stream.fullStream`，把事件转成可持久化的 message parts：
- tool-input-start / tool-call / tool-result / tool-error → tool part 状态机（pending/running/completed/error）
- text-start/text-delta/text-end → text part 增量写入
- reasoning-* → reasoning part
- start-step/finish-step → step parts + usage tokens + finish reason
- snapshot/patch → patch part（记录文件改动）

实现位置：[processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L19-L405)。

额外防护：
- doom loop 检测：连续 3 次同工具同输入会触发 doom_loop permission ask [processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L143-L168)

---

## 7. 一个端到端的工具调用时序图

```text
SessionPrompt.loop()
  -> resolveTools(): ToolRegistry.tools + MCP.tools -> AI SDK tools
  -> SessionProcessor.process()
     -> LLM.stream(streamText)
        -> 模型输出 tool-call
        -> AI SDK 执行对应 tool.execute(...)
        -> stream.fullStream 发出 tool-call/tool-result 事件
     -> SessionProcessor 把 tool 状态写入 Storage（part）
  -> 下一个 loop step：根据 finishReason 决定继续/compact/stop
```

