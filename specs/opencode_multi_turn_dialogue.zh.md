# OpenCode 的多轮对话（Multi-turn）与循环推进逻辑是怎么实现的

本文聚焦 OpenCode 在一次会话（session）里如何：
- 持久化消息（message/parts）
- 把“用户输入 → 模型流式输出 → 工具调用/结果 → 写回消息”串成可重复的循环
- 处理多轮追加消息、最大步数、失败重试、上下文溢出与压缩（compaction）

---

## 1. 会话数据模型：MessageV2 = Info + Parts

OpenCode 的对话不是只存“role/content”，而是拆成：
- `MessageV2.Info`：message 元信息（role、agent、model、finish、tokens、time…）
- `MessageV2.Part[]`：细粒度内容与状态（text/reasoning/tool/step/patch/compaction/subtask…）

关键定义与转换：
- Part 类型（含 CompactionPart/SubtaskPart）：[message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L170-L216)
- 转模型 messages（user/assistant/tool parts → provider 兼容 message 结构）：[toModelMessages](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L478-L701)

持久化读取：
- MessageV2.stream 从 Storage 逆序回放 message 列表：[message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L703-L711)
- MessageV2.parts 读取并按 part.id 排序：[message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L713-L721)

---

## 2. 主循环：SessionPrompt.loop 是“多轮推进”的引擎

多轮对话的核心驱动是 [SessionPrompt.loop](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L272-L722)。

### 2.1 busy/abort/queued callbacks（并发与恢复）

SessionPrompt 维护一个 per-session 的 state：
- `abort: AbortController`：用于取消当前循环
- `callbacks[]`：当已有循环在跑时，后续 loop 调用会挂到 callbacks，等待完成后 resolve

实现见 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L65-L90) 与 [loop](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L276-L285)。

### 2.2 每个 step 的 3 类分支：subtask / compaction / normal

loop 每步会从 `MessageV2.filterCompacted(MessageV2.stream(sessionID))` 得到当前有效消息窗口，并倒序找：
`lastUser` / `lastAssistant` / `lastFinished` 以及待处理 `tasks`（compaction/subtask parts）[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L300-L317)。

然后按优先级处理：

1) **pending subtask**：如果 tasks 里有 subtask part，loop 会直接构造一条 assistant message + tool part，并执行 TaskTool（相当于“自动执行 task 工具”）[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L350-L522)。

2) **pending compaction**：如果 tasks 里有 compaction part，调用 SessionCompaction.process 执行压缩 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L524-L535)。

3) **normal processing**：创建本轮 assistant message，resolveTools，然后交给 SessionProcessor.process 驱动模型流式输出与工具调用 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L552-L710)。

这也是为什么 OpenCode 能在同一 session 内“穿插”子任务与压缩任务：它们被建模为 parts，然后在 loop 顶层被消费。

---

## 3. 流式输出如何写回会话：SessionProcessor.process

SessionProcessor 是“把 LLM 输出落盘为 MessageV2 parts”的状态机：
- 输入：一个已创建并写入 Storage 的 assistant message（作为容器）
- 输出：根据 finish/error/compaction 判断下一步 loop 行为（continue/stop/compact）

实现见 [processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L19-L405)。

### 3.1 关键事件 → parts 的映射

- tool-input-start/tool-call/tool-result/tool-error → tool part（pending/running/completed/error）
- text-start/text-delta/text-end → text part（增量写入）
- reasoning-* → reasoning part
- start-step/finish-step → step-start/step-finish part（包含 tokens/cost/finish reason）
- snapshot/patch → patch part（文件改动记录）

### 3.2 重试与阻塞

当流式过程抛错：
- error 会被归一化为 MessageV2.fromError（含 APIError/ContextOverflowError 等）[processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L339-L367)。
- 若 SessionRetry.retryable(error) 判定可重试，则按 backoff 延迟后继续同一轮 while(true) [processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L348-L360) + [retry.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/retry.ts#L61-L100)。
- 若工具失败是 PermissionNext.RejectedError 或 Question.RejectedError，会设置 blocked；是否立刻 stop 受 `experimental.continue_loop_on_deny` 控制 [processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L48-L49) 与 [processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L212-L218)。

---

## 4. “多轮追加消息”如何处理：queued user reminder

当 loop 已经在进行中，用户又追加了新消息（并且它们位于 lastFinished 之后）：
- loop 会把这些新 user text part 临时包一层 `<system-reminder>...Please address this message and continue...</system-reminder>`
- 这是“软约束”：不改动存储，只在本轮发给模型的 messages 上做 ephemeral 改写

实现位置：[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L625-L645)。

---

## 5. 上下文溢出与压缩：SessionCompaction

### 5.1 溢出检测

SessionCompaction.isOverflow 通过：
- 模型 context limit
- 本轮 tokens 使用量
- 预留 reserved（默认取 min(20k, maxOutputTokens) 或 config.compaction.reserved）

判断是否到达可用输入上限 [compaction.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L32-L48)。

loop 会在正常处理前检查 lastFinished.tokens 是否溢出，若溢出则创建 compaction 任务并 continue [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L537-L550)。

### 5.2 compaction 的执行与“历史切断”

compaction 被建模为：
- 一条 user message + CompactionPart（auto 标记）[compaction.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L231-L259)
- 随后由 loop 捕获并调用 SessionCompaction.process 执行

process 会创建一条 `summary: true` 的 assistant message（agent=compaction），让模型生成“续写用摘要” [compaction.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L101-L229)。

filterCompacted 会用 `assistant.summary && assistant.finish` 记录 completed parentID，并在遇到该 parentID 的 user message 且含 compaction part 时 break，从而只保留“最近一次压缩之后的对话窗口”[message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L736-L750)。

### 5.3 tool output 清理（prune）

为进一步节省上下文，prune 会在足够旧的 turn 里清空旧 tool output（打 compacted 时间戳），并保护特定工具（如 skill）不被清 [compaction.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L50-L99)。

---

## 6. 最大步数（agentic steps）限制

loop 里按 `agent.steps` 计数：
- `isLastStep = step >= maxSteps`
- 若是最后一步，会在发给模型的 messages 末尾追加一段 `MAX_STEPS` 文本，要求“禁用所有工具，只能输出文本总结”[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L553-L675)。

MAX_STEPS 文本内容见 [max-steps.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/max-steps.txt)。

---

## 7. API 层如何触发多轮循环（server/routes/session.ts）

关键端点：
- `POST /:sessionID/message` → 调用 SessionPrompt.prompt（创建 user message 并进入 loop）[session.ts](file:///d:/github_repo/opencode/packages/opencode/src/server/routes/session.ts#L697-L737)
- `POST /:sessionID/prompt_async` → 异步启动 prompt（返回 204）[session.ts](file:///d:/github_repo/opencode/packages/opencode/src/server/routes/session.ts#L738-L768)
- `POST /:sessionID/summarize` → 创建 compaction 任务并执行 loop [session.ts](file:///d:/github_repo/opencode/packages/opencode/src/server/routes/session.ts#L487-L545)

