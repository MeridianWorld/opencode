# Findings：OpenCode agent 规划/工具/多轮对话（代码阅读记录）

## 线索与入口
- 现有总结（Prompt/拼接）：[prompt_analysis.zh.md](file:///d:/github_repo/opencode/specs/prompt_analysis.zh.md)
- agent/runtime 关键实现目录：packages/opencode/src
- tool 定义：packages/opencode/src/tool/*.(ts|txt)
- session：packages/opencode/src/session/*
- server 路由（对话/会话 API）：packages/opencode/src/server/routes/*

## 已确认的关键实现点（带代码引用）
- 主循环入口：SessionPrompt.loop（从消息流中找 lastUser/lastFinished，处理 subtask/compaction/normal 三类分支）[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L272-L722)
- Planning 的“实现”不是抽象概念，而是：
  - plan/build 两个 primary agent + PermissionNext 规则集限制可用工具 [agent.ts](file:///d:/github_repo/opencode/packages/opencode/src/agent/agent.ts#L51-L129)
  - insertReminders 在进入/退出 plan 时向 user message 注入 system-reminder（含分阶段 workflow），并在 plan→build 时提示执行 plan 文件 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1327-L1465)
  - plan_enter / plan_exit 工具负责“请求用户确认”并通过 synthetic user message 切换 agent [plan.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/plan.ts#L20-L130)
  - plan 文件路径由 Session.plan 决定：有 VCS 时落在 repo 的 .opencode/plans，否则落在全局 data/plans [session/index.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/index.ts#L251-L256)
- Tool use 装配：
  - ToolRegistry.all/ToolRegistry.tools 负责聚合内置工具 + 插件/自定义工具，并做 model 兼容选择（apply_patch vs edit/write）[registry.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/registry.ts#L94-L167)
  - SessionPrompt.resolveTools 把 ToolRegistry 的 Tool.Info 转成 AI SDK tool（description + JSON schema + execute wrapper），并注入 plugin hooks/permission ask [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L731-L912)
  - Tool.define 在执行前做 zod schema 校验，并统一做输出截断 Truncate.output [tool.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/tool.ts#L48-L88)
- 多轮对话与“状态推进”：
  - LLM 流式输出由 SessionProcessor.process 消费，分事件写入 message parts（text/reasoning/tool/step/patch），并在工具重复调用时触发 doom_loop permission [processor.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L19-L405)
  - MessageV2.stream 从 Storage 按 messageID 逆序回放；filterCompacted 用 summary+compaction part 切断历史，实现“从最近一次 compaction 之后”继续 [message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L703-L751)
  - toModelMessages 把 MessageV2.WithParts 转换为模型 messages，并处理“工具结果 media 附件兼容”（必要时拆成额外 user message）[message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L478-L701)
  - SessionCompaction.isOverflow/process/prune 实现自动压缩（summary agent）、阈值判断、以及旧 tool output 清理 [compaction.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L32-L229)
  - queued user messages：loop 会把 lastFinished 之后的新 user text 临时包裹 system-reminder，提示“先处理新消息再继续任务”[prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L625-L645)
  - max steps：按 agent.steps 限制，最后一步会在 messages 末尾追加 MAX_STEPS 文本，迫使停止工具调用 [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L553-L675) + [max-steps.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/max-steps.txt)
- Read 工具：读文件时会 InstructionPrompt.resolve “就近指令文件”并以 system-reminder 附加到输出末尾 [read.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.ts#L111-L202)
- Subagent：TaskTool 会创建/复用子 session，并用 SessionPrompt.prompt 在子 session 内跑一轮完整 loop，输出包含 task_id 便于继续 [task.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/task.ts#L14-L165)

## 待补充（写文档时展开）
- PermissionNext 的规则合并与 ask/deny 行为：如何决定“阻塞 stop” vs “继续循环”。
- server/routes/session.ts：外部 API 触发 prompt/loop/compaction 的端点与参数。
