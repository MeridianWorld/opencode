# OpenCode 摘要机制技术分析

## 概述

本文档详细分析 OpenCode 中的上下文摘要（Compaction）机制，包括启动时机、交互流程、能力形式以及技术实现细节。

## 目录

- [1. 摘要机制概述](#1-摘要机制概述)
- [2. 摘要启动时机](#2-摘要启动时机)
- [3. 交互流程分析](#3-交互流程分析)
- [4. 能力形式：提示词驱动](#4-能力形式提示词驱动)
- [5. 技术实现细节](#5-技术实现细节)
- [6. 插件扩展机制](#6-插件扩展机制)
- [7. 设计优势与考量](#7-设计优势与考量)

---

## 1. 摘要机制概述

OpenCode 的摘要机制是上下文管理系统的核心组件，负责在对话历史过长时生成智能摘要，替代原始的大段对话内容。该机制采用**结构化模板填表**的方式，确保摘要的一致性和可读性。

### 核心特点
- **自动触发**：基于 Token 溢出检测
- **结构化输出**：预定义的模板格式
- **插件扩展**：支持自定义字段和提示词
- **无工具调用**：纯提示词驱动，确保稳定性

---

## 2. 摘要启动时机

### 2.1 自动触发（Token 溢出检测）

**触发条件检测代码**：
```typescript
// 上下文溢出检测（位于 prompt.ts:L537-L550）
if (lastFinished && 
    lastFinished.summary !== true &&
    (await SessionCompaction.isOverflow({ tokens: lastFinished.tokens, model }))) {
  await SessionCompaction.create({ sessionID, agent: lastUser.agent, model: lastUser.model, auto: true })
  continue
}
```

**代码位置**：`[prompt.ts:L537-L550](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L537-L550)`
**功能说明**：在对话循环中检测是否需要启动压缩的触发条件判断
**技术细节**：
- 检查上一轮对话是否已完成且不是摘要消息
- 调用 `SessionCompaction.isOverflow()` 进行 Token 溢出检测
- 如果检测到溢出，调用 `SessionCompaction.create()` 创建压缩任务
**上下文关联**：这是压缩机制的主入口点，决定是否进入压缩流程

**溢出检测算法**：
```typescript
export async function isOverflow(input: { tokens: MessageV2.Assistant["tokens"]; model: Provider.Model }) {
  const config = await Config.get()
  if (config.compaction?.auto === false) return false
  const context = input.model.limit.context
  if (context === 0) return false

  const count = input.tokens.total ||
    input.tokens.input + input.tokens.output + input.tokens.cache.read + input.tokens.cache.write

  const reserved = config.compaction?.reserved ?? 
    Math.min(COMPACTION_BUFFER, ProviderTransform.maxOutputTokens(input.model))
  
  const usable = input.model.limit.input
    ? input.model.limit.input - reserved
    : context - ProviderTransform.maxOutputTokens(input.model)
  
  return count >= usable
}
```

**代码位置**：`[compaction.ts:L32-L48](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L32-L48)`
**功能说明**：Token 溢出检测的核心算法，计算当前上下文是否超过模型限制
**技术细节**：
- **Token 计数**：累计 `input + output + cache.read + cache.write`，优先使用 `tokens.total`
- **配置检查**：如果 `config.compaction?.auto === false` 则永不触发压缩
- **预留缓冲区**：默认 `min(20,000, 模型最大输出token数)`，确保有足够空间生成响应
- **可用窗口计算**：根据模型是否有输入限制采用不同算法
- **触发条件**：当累计 Token 数 ≥ 可用窗口时返回 true
**性能考量**：算法复杂度 O(1)，仅涉及简单算术运算

**触发条件详解**：
- **Token 计数**：累计 `input + output + cache.read + cache.write`
- **预留缓冲区**：默认 `min(20,000, 模型最大输出token数)`
- **可用窗口**：`模型输入限制 - 预留缓冲区` 或 `上下文窗口 - 最大输出token数`
- **触发阈值**：当累计 Token 数 ≥ 可用窗口时启动摘要

### 2.2 手动触发（Pending Compaction）

当检测到有挂起的压缩任务时立即启动：
```typescript
// 检测挂起的压缩任务（位于 prompt.ts:L524-L535）
if (task?.type === "compaction") {
  const result = await SessionCompaction.process({ 
    messages: msgs, 
    parentID: lastUser.id, 
    abort, 
    sessionID, 
    auto: task.auto 
  })
  if (result === "stop") break
  continue
}
```

**代码位置**：`[prompt.ts:L524-L535](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L524-L535)`
**功能说明**：检测并处理挂起的压缩任务，实现手动触发机制
**技术细节**：
- 检查当前任务类型是否为 `compaction`
- 调用 `SessionCompaction.process()` 执行压缩处理
- 根据处理结果决定是否继续对话循环
- `result === "stop"` 表示需要终止当前处理流程
**上下文关联**：这是压缩任务的执行入口，确保挂起的压缩任务得到及时处理

---

## 3. 交互流程分析

摘要生成遵循**两阶段交互流程**：

### 3.1 第一阶段：创建压缩请求

1. **检测溢出** → 调用 `SessionCompaction.create()`
2. **写入压缩消息**：创建带有 `compaction` part 的 user message
3. **标记为挂起**：等待下一轮处理

### 3.2 第二阶段：执行摘要生成

1. **下一轮检测**：识别到 pending compaction task
2. **调用处理器**：执行 `SessionCompaction.process()`
3. **构建上下文**：使用 `MessageV2.toModelMessages()` 加载所有可见消息
4. **追加任务描述**：添加摘要生成指令
5. **生成摘要**：调用 LLM 生成结构化摘要
6. **写入结果**：创建带有 `summary: true` 标记的 assistant message

**流程示意图**：
```
检测溢出 → 创建压缩请求 → 等待下一轮 → 执行摘要生成 → 写入结果
```

---

## 4. 能力形式：提示词驱动

### 4.1 无工具调用设计

摘要机制采用**提示词（Prompt）形式，而非工具（Tool）形式**：

```typescript
// 位于 compaction.ts:L180-L200
const result = await processor.process({
  user: userMessage,
  agent,
  abort: input.abort,
  sessionID: input.sessionID,
  tools: {},  // 空工具集，确保稳定可控
  system: [],
  messages: [...MessageV2.toModelMessages(input.messages, model), {
    role: "user",
    content: [{ type: "text", text: promptText }]  // 纯文本提示词
  }],
  model,
})
```

### 4.2 结构化提示词模板

**标准模板定义**（位于 compaction.ts:L147-L186）：
```typescript
const defaultPrompt = `Provide a detailed prompt for continuing our conversation above.
Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next.
The summary that you construct will be used so that another agent can read it and continue the work.

When constructing the summary, try to stick to this template:
---
## Goal

[What goal(s) is the user trying to accomplish?]

## Instructions

- [What important instructions did the user give you that are relevant]
- [If there is a plan or spec, include information about it so next agent can continue using it]

## Discoveries

[What notable things were learned during this conversation that would be useful for the next agent to know when continuing the work]

## Accomplished

[What work has been completed, what work is still in progress, and what work is left?]

## Relevant files / directories

[Construct a structured list of relevant files that have been read, edited, or created that pertain to the task at hand. If all the files in a directory are relevant, include the path to the directory.]
---`
```

### 4.3 模板字段说明

| 字段 | 描述 | 重要性 |
|------|------|--------|
| **Goal** | 用户目标 | 高 |
| **Instructions** | 重要指令和规范 | 高 |
| **Discoveries** | 关键发现 | 中 |
| **Accomplished** | 完成进度 | 高 |
| **Relevant files/directories** | 相关文件列表 | 中 |

---

## 5. 技术实现细节

### 5.1 压缩处理器实现

**核心处理函数**（位于 compaction.ts:L101-L229）：
```typescript
export async function process(input: {
  parentID: string
  messages: MessageV2.WithParts[]
  sessionID: string
  abort: AbortSignal
  auto: boolean
}) {
  // 1. 选择压缩代理和模型
  const agent = await Agent.get("compaction")
  const model = agent.model
    ? await Provider.getModel(agent.model.providerID, agent.model.modelID)
    : await Provider.getModel(userMessage.model.providerID, userMessage.model.modelID)
  
  // 2. 创建摘要消息
  const msg = await Session.updateMessage({
    id: Identifier.ascending("message"),
    role: "assistant",
    parentID: input.parentID,
    sessionID: input.sessionID,
    mode: "compaction",
    agent: "compaction",
    summary: true,  // 关键标记
    // ... 其他字段
  })
  
  // 3. 触发插件钩子
  const compacting = await Plugin.trigger(
    "experimental.session.compacting",
    { sessionID: input.sessionID },
    { context: [], prompt: undefined },
  )
  
  // 4. 构建提示词
  const promptText = compacting.prompt ?? [defaultPrompt, ...compacting.context].join("\n\n")
  
  // 5. 执行摘要生成
  const result = await processor.process({
    user: userMessage,
    agent,
    abort: input.abort,
    sessionID: input.sessionID,
    tools: {},
    system: [],
    messages: [
      ...MessageV2.toModelMessages(input.messages, model),
      { role: "user", content: [{ type: "text", text: promptText }] }
    ],
    model,
  })
}
```

### 5.2 消息边界管理

**摘要边界检测**（位于 message-v2.ts:L736-L751）：
```typescript
export async function filterCompacted(stream: AsyncIterable<MessageV2.WithParts>) {
  const result = [] as MessageV2.WithParts[]
  const completed = new Set<string>()
  
  for await (const msg of stream) {
    result.push(msg)
    
    // 检测压缩边界
    if (msg.info.role === "user" && 
        completed.has(msg.info.id) && 
        msg.parts.some((part) => part.type === "compaction")) {
      break
    }
    
    // 标记完成的对话回合
    if (msg.info.role === "assistant" && msg.info.summary && msg.info.finish) {
      completed.add(msg.info.parentID)
    }
  }
  
  return result.reverse()
}
```

---

## 6. 插件扩展机制

### 6.1 插件钩子接口

通过 `experimental.session.compacting` 钩子支持自定义：

```typescript
// 插件实现示例
export const CustomCompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // 注入自定义结构化字段
      output.context.push(`
## Custom Context

Include any state that should persist across compaction:
- Current task status
- Important decisions made
- Files being actively worked on
`)
      
      // 或者完全替换提示词
      output.prompt = `
You are generating a continuation prompt for a multi-agent swarm session.

Summarize:
1. The current task and its status
2. Which files are being modified and by whom
3. Any blockers or dependencies between agents
4. The next steps to complete the work

Format as a structured prompt that a new agent can use to resume work.
`
    },
  }
}
```

### 6.2 插件配置选项

| 配置项 | 类型 | 描述 |
|--------|------|------|
| `output.context` | `string[]` | 追加到默认提示词的额外上下文 |
| `output.prompt` | `string` | 完全替换默认提示词 |

---

## 7. 设计优势与考量

### 7.1 设计优势

1. **稳定性**：无工具调用，避免工具执行错误
2. **可控性**：固定的输出格式和结构
3. **可扩展性**：通过插件机制支持自定义
4. **一致性**：所有摘要遵循相同模式
5. **机器可读**：结构化数据便于后续处理

### 7.2 技术考量

1. **性能优化**：Token 估算算法确保及时触发
2. **边界管理**：摘要消息作为上下文截断边界
3. **错误处理**：健壮的检索和生成机制
4. **并发安全**：文件锁机制确保数据一致性

### 7.3 与其他系统的对比

| 特性 | OpenCode | 传统摘要 | 数据库记录 |
|------|----------|----------|------------|
| **结构化程度** | 高（模板填表） | 低（自由文本） | 高（固定字段） |
| **扩展性** | 高（插件机制） | 低 | 中 |
| **稳定性** | 高（无工具调用） | 中 | 高 |
| **一致性** | 高（预定义模板） | 低 | 高 |

---

## 总结

OpenCode 的摘要机制体现了**工程化思维**在上下文管理中的应用：通过预定义的结构化模板和可控的提示词交互，确保摘要生成的一致性和可靠性，同时保持足够的灵活性来适应不同场景需求。这种设计在稳定性、可控性和扩展性之间取得了良好的平衡。

**核心价值**：
- 智能的上下文缩减策略
- 结构化的知识提取和重组
- 可扩展的插件架构
- 稳定的无工具执行环境