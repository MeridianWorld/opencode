# OpenCode 项目提示词（Prompt）是怎么写/怎么拼接的

这份文档基于仓库代码阅读，总结 OpenCode 在一次对话里是如何构建 **system prompt / user messages / tool prompts** 的，以及你能在哪些地方自定义这些提示词。

---

## 1. 总体结构：一次请求里会发送哪些“提示词”

从模型视角看，一次 LLM 调用大致是：

1. **System messages（系统提示词）**
   - 由「模型/供应商默认系统提示词」+「运行环境信息」+「用户/项目指令」+「本次请求附加 system」拼成。
2. **Conversation messages（对话消息，role=user/assistant）**
   - 用户输入、附件、工具调用与工具结果都会被转成模型能吃的 message。
3. **Tools（工具定义）**
   - 每个工具都有 `description` 和 `inputSchema`，它们本质上也是“提示词”：告诉模型如何调用工具。

核心组装路径：
- [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts)
- [llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts)
- [message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts)

---

## 2. System Prompt 怎么选：按模型/供应商选模板

SystemPrompt 有两部分：

### 2.1 provider prompt：不同模型用不同模板

在 [system.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/system.ts#L14-L27) 里，根据 `model.api.id` 选择一份系统提示词模板：

- `gpt-5*` → [codex_header.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/codex_header.txt)
- `gpt-*` / `o1` / `o3` → [beast.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/beast.txt)
- `gemini-*` → [gemini.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/gemini.txt)
- `claude*` → [anthropic.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/anthropic.txt)
- `*trinity*` → [trinity.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/trinity.txt)
- 其他 → [qwen.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/qwen.txt)

这些模板里写的就是你看到的“系统提示词”，例如：输出风格、工具使用策略、安全规则、是否要用 todo、是否要极简回答等。

### 2.2 environment prompt：运行环境注入

在 [system.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/system.ts#L29-L53) 里还会注入 `<env>` 块（工作目录、平台、日期等）。这会作为 system message 的一部分发给模型。

---

## 3. System Prompt 的拼接顺序（非常关键）

真正发送给模型时，system prompt 的来源和拼接顺序在 [LLM.stream](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L44-L79)：

1. **agent.prompt（如果该 agent 自己配置了 prompt，就优先用它）**
   - 否则用 `SystemPrompt.provider(model)` 选出来的模板。
2. **input.system（调用侧传入的 system 数组）**
   - 在主对话里，这通常来自 `SystemPrompt.environment(model)` + `InstructionPrompt.system()`（见第 4 节）。
3. **user.system（本次用户消息上附带的自定义 system 字符串）**

然后还会有一个插件钩子允许二次改写 system：
- `experimental.chat.system.transform`（见 [llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L79-L111)）

这意味着：**“默认模板”只是底座；agent、项目指令、单次请求都可以往上叠。**

---

## 4. “项目/用户指令”是怎么进来的（类似 Claude Code 的 AGENTS.md/CLAUDE.md）

InstructionPrompt 负责加载“指令文件”，然后把内容塞进 system prompt 或者 tool 输出里。

入口与规则：
- [instruction.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/instruction.ts)

### 4.1 启动时全局加载到 system（InstructionPrompt.system）

[InstructionPrompt.system](file:///d:/github_repo/opencode/packages/opencode/src/session/instruction.ts#L118-L145) 会加载：
- 项目内向上查找（findUp）：
  - `AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`（deprecated）
- 全局位置（用户机器/配置目录）：
  - `~/.claude/CLAUDE.md`（可禁用）
  - 全局 config 目录下的 `AGENTS.md`
- `config.instructions` 里配置的：
  - 本地文件（绝对路径或相对向上 glob）
  - URL（HTTP(S) 拉取文本）

每段内容会被包装为：
`Instructions from: <path or url>\n<content>`

### 4.2 读文件时按目录就近加载（InstructionPrompt.resolve + ReadTool）

当模型调用 Read 工具读取某个文件时：
- [read.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.ts#L111-L202) 会调用 `InstructionPrompt.resolve(...)`
- `resolve` 会从目标文件所在目录开始一路向上找 `AGENTS.md/CLAUDE.md/CONTEXT.md`
- 找到且未加载过的，会被追加到 Read 的输出末尾，用 `<system-reminder>` 包起来

效果：**“就近的工程指令”会随着读文件一起进入上下文**，并且通过 `loaded` 机制避免重复注入。

---

## 5. “系统提醒（system-reminder）”是怎么插入的

OpenCode 会把一些控制性信息用 `<system-reminder>...</system-reminder>` 包起来，混在用户消息或工具输出中，逼近“系统级提示”的效果。

常见几类：

### 5.1 Plan 模式提醒（只读约束）

Plan 模式时会向用户消息里追加一段 synthetic 文本 part：
- 模板： [plan.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/plan.txt)
- 插入逻辑： [insertReminders](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1326-L1360)

其中核心语义是：**强制只读，禁止编辑/运行会修改系统的工具。**

### 5.2 从 plan 切回 build 的提醒

- 模板：[build-switch.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/build-switch.txt)
- 同样由 `insertReminders` 注入。

### 5.3 队列用户消息的“保持任务连续性”提醒

当 agent 在多步循环中运行，用户又追加了新消息时，会把用户文本包一层提醒，提示模型“处理这条新消息并继续任务”：
- 逻辑位置： [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L620-L654)

### 5.4 最大步数限制提醒

当达到最大 agentic steps，会在 messages 末尾追加一条 assistant content：
- 模板：[max-steps.txt](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt/max-steps.txt)
- 注入位置： [prompt.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L662-L682)

---

## 6. Tools 的“提示词”在哪里：每个工具都有自己的说明书

工具对模型来说不仅是 function schema，还包含 `description`。OpenCode 把工具说明写在独立的 `*.txt` 文件里，然后在代码里作为 `description` 塞给模型。

核心路径：

1. 工具定义读取 `description`（通常来自 `packages/opencode/src/tool/*.txt`）
   - 例子：Read 工具读 [read.txt](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.txt) 并在 [read.ts](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.ts#L7-L23) 作为 description 使用
2. 把工具注册成 AI SDK tool（包含 description + inputSchema）
   - [resolveTools](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L731-L815)

所以你看到的“工具使用规范（如何读文件、如何 grep、如何提问等）”，本质上是**分散在各个 tool 的 description prompt**里。

---

## 7. 对话消息（user/assistant/tool）如何转成模型 messages

OpenCode 内部存的是 `MessageV2`（带多 part：text/file/tool/reasoning 等），最终会在发送前转换为模型 messages：

- 转换入口：[MessageV2.toModelMessages](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L478-L701)

你需要知道的关键点：
- user 的 `text` part 会变成 user message 的 text
- user 的非纯文本附件会变成 file part（如果模型支持）
- tool result 会作为 assistant message 的 `tool-*` part
- 某些提供商对“工具结果里带图片/PDF”支持不一致，会把媒体拆出来额外注入一条 user message（见 [message-v2.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L490-L688)）

---

## 8. 你能怎么自定义这些提示词

### 8.1 自定义 agent 的 prompt（最高优先级的系统底座）

Agent 支持 `prompt` 字段；如果设置了，会覆盖 provider 默认模板（见 [llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L44-L64)）。

配置来源有两类：

1. 配置文件（config.json 等）里的 `agent.*.prompt`
   - schema 在 [config.ts](file:///d:/github_repo/opencode/packages/opencode/src/config/config.ts#L673-L741)
2. Markdown agent 文件（推荐方式之一）
   - 会扫描 `{agent,agents}/**/*.md` 并把 markdown 正文作为 prompt
   - 解析逻辑在 [config.ts](file:///d:/github_repo/opencode/packages/opencode/src/config/config.ts#L378-L417)
   - 支持目录：`/.opencode/agent/`、`/.opencode/agents/`、`/agent/`、`/agents/`（见同段代码里的 `patterns`）

### 8.2 项目级指令（InstructionPrompt）

在项目根或子目录放 `AGENTS.md` / `CLAUDE.md`，会被自动加载（第 4 节）。

### 8.3 单次请求附加 system

`MessageV2.User.system` 字段会在 [llm.ts](file:///d:/github_repo/opencode/packages/opencode/src/session/llm.ts#L61-L64) 作为最后一段系统提示词拼进去，适合“这次对话临时加规则”。

---

## 9. 一张流程图（从用户输入到模型调用）

```
用户输入(parts) -> SessionPrompt.prompt() 写入 MessageV2
  -> loop(): 组装 tools + 组装 system(env + instructions + ...)
    -> MessageV2.toModelMessages() 得到 role=user/assistant 历史
    -> LLM.stream():
         system = [agent.prompt 或 provider模板] + input.system + user.system
         messages = systemMessages + conversationMessages
         tools = resolveTools() 注册的 tool(description + schema)
      -> 调用模型
```

