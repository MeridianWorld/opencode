# OpenCode 上下文选择机制深度分析

## 概述

本文档基于对 OpenCode 项目的深入代码分析，系统性地解析其上下文选择机制。OpenCode 采用了一套智能、多层次的上下文管理系统，通过动态检测、压缩、修剪等策略，有效管理有限的上下文窗口资源。

## 1. 动态上下文特性

### 1.1 实时 Token 监控

**代码位置**：`[compaction.ts:L32-L48](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L32-L48)`
**功能说明**：OpenCode 实现了完全动态的上下文管理，能够根据实时 Token 使用情况自动调整上下文内容
**技术细节**：

```typescript
// 动态计算累计 Token 使用量
const count = input.tokens.total || 
  input.tokens.input + input.tokens.output + input.tokens.cache.read + input.tokens.cache.write

// 根据模型能力动态调整预留缓冲区
const reserved = config.compaction?.reserved ?? 
  Math.min(COMPACTION_BUFFER, ProviderTransform.maxOutputTokens(input.model))
```

### 1.2 动态特性总结

- ✅ **实时监控**：持续跟踪 Token 使用量变化
- ✅ **模型感知**：自适应不同模型的上下文限制
- ✅ **渐进调整**：支持部分压缩和渐进式管理
- ✅ **配置驱动**：通过配置文件灵活调整策略参数

## 2. 上下文选择时机

### 2.1 主要触发时机

#### 2.1.1 对话循环结束时机

**代码位置**：`[prompt.ts:L524-L550](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L524-L550)`
**功能说明**：每次对话循环结束后检测上下文状态，决定是否需要压缩
**触发条件**：
- 上一轮对话已完成且不是摘要消息
- Token 使用量超过可用窗口阈值

```typescript
if (lastFinished && 
    lastFinished.summary !== true &&
    (await SessionCompaction.isOverflow({ tokens: lastFinished.tokens, model }))) {
  await SessionCompaction.create({ sessionID, agent: lastUser.agent, model: lastUser.model, auto: true })
  continue
}
```

#### 2.1.2 工具调用完成时机

**代码位置**：`[processor.ts:L270-L276](file:///d:/github_repo/opencode/packages/opencode/src/session/processor.ts#L270-L276)`
**功能说明**：每次工具调用完成后立即评估上下文状态
**技术细节**：
- 工具输出写入后立即进行上下文评估
- 检测是否需要启动压缩或修剪操作
- 确保工具结果不会导致上下文溢出

#### 2.1.3 定期修剪时机

**代码位置**：`[prompt.ts:L712-L712](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L712-L712)`
**功能说明**：每次对话循环结束后执行定期修剪维护
**执行逻辑**：
```typescript
await SessionCompaction.prune({ sessionID })
```

### 2.2 条件判断逻辑

#### 2.2.1 压缩触发条件
- **Token 阈值**：累计 Token 使用量 ≥ 可用窗口
- **模型限制**：考虑模型的最大上下文限制
- **配置开关**：`config.compaction.auto` 控制自动压缩

#### 2.2.2 修剪触发条件
- **工具输出量**：累计工具输出 Token > PRUNE_PROTECT (40,000)
- **时间窗口**：至少保留最近 2 轮对话的工具输出
- **保护机制**：特定工具（如 "skill"）不受修剪影响

## 3. 上下文选择机制

### 3.1 核心选择机制

#### 3.1.1 压缩边界截断机制

**代码位置**：`[message-v2.ts:L736-L751](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L736-L751)`
**功能说明**：智能识别压缩边界，确保上下文的连贯性
**算法实现**：

```typescript
export function* filterCompacted(messages: Iterable<WithParts>) {
  for (const message of messages) {
    if (message.role === "user" && hasCompactionPart(message)) {
      break // 遇到压缩边界时停止
    }
    if (message.role === "assistant" && message.summary) {
      break // 遇到摘要消息时停止
    }
    yield message
  }
}
```

#### 3.1.2 工具输出修剪机制

**代码位置**：`[compaction.ts:L68-L98](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L68-L98)`
**功能说明**：基于时间和相关性的工具输出选择策略
**算法特点**：
- **反向遍历**：从最新消息向旧消息遍历
- **时间窗口保护**：至少保护最近2轮对话
- **Token 限制**：PRUNE_PROTECT 阈值控制保留量

### 3.2 选择算法细节

#### 3.2.1 时间窗口选择算法
- **最近优先**：优先保留最近的对话内容
- **轮次保护**：至少保护最近2轮完整对话
- **衰减策略**：越早的内容被修剪的概率越高

#### 3.2.2 压缩摘要生成算法

**代码位置**：`[compaction.ts:L100-L229](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L100-L229)`
**功能说明**：智能生成对话摘要，替代原始对话内容
**技术细节**：
- **关键信息提取**：保留重要的决策和代码变更
- **冗余信息过滤**：去除重复和不重要的对话内容
- **结构优化**：重新组织信息，提高可读性

### 3.3 机制执行流程

#### 3.3.1 实时选择流程
1. **上下文检索**：`MessageV2.stream()` 获取所有历史消息
2. **边界过滤**：`filterCompacted()` 应用压缩边界
3. **内容选择**：基于时间和相关性选择保留内容
4. **格式转换**：`toModelMessages()` 转换为模型格式

#### 3.3.2 压缩执行流程
1. **溢出检测**：`isOverflow()` 检测是否需要压缩
2. **摘要生成**：调用摘要 Agent 生成智能摘要
3. **状态更新**：更新消息状态，标记压缩边界
4. **事件通知**：发送压缩完成事件

## 4. 上下文类别和选择策略

### 4.1 上下文类别分类

#### 4.1.1 系统指令上下文

**代码位置**：`[instruction.ts:L118-L145](file:///d:/github_repo/opencode/packages/opencode/src/session/instruction.ts#L118-L145)`
**功能说明**：包含项目指令、环境配置等系统级信息
**选择策略**：
- **强制保留**：始终包含在上下文开头
- **优先级最高**：不受压缩和修剪影响
- **动态解析**：根据项目状态动态生成

#### 4.1.2 对话历史上下文

**代码位置**：`[message-v2.ts:L478-L701](file:///d:/github_repo/opencode/packages/opencode/src/session/message-v2.ts#L478-L701)`
**功能说明**：用户与助手的对话记录
**选择策略**：
- **压缩边界截断**：只保留最近压缩点之后的内容
- **时间窗口保护**：优先保留最近的对话
- **摘要替代**：用智能摘要替代原始长对话

#### 4.1.3 工具反馈上下文

**代码位置**：`[compaction.ts:L68-L98](file:///d:/github_repo/opencode/packages/opencode/src/session/compaction.ts#L68-L98)`
**功能说明**：工具执行的结果和输出
**选择策略**：
- **最近优先**：保护最近2轮对话的工具输出
- **类型区分**：特定工具类型受保护（如 "skill"）
- **Token 限制**：PRUNE_PROTECT 阈值控制保留量

#### 4.1.4 文件内容上下文

**代码位置**：`[prompt.ts:L1088-L1197](file:///d:/github_repo/opencode/packages/opencode/src/session/prompt.ts#L1088-L1197)`
**功能说明**：用户引用的文件内容
**选择策略**：
- **智能注入**：通过 Read 工具自动注入文件内容
- **格式处理**：文本文件直接注入，其他格式特殊处理
- **上下文关联**：与当前任务相关的文件优先保留

#### 4.1.5 知识库上下文

**代码位置**：`[read.ts:L111-L203](file:///d:/github_repo/opencode/packages/opencode/src/tool/read.ts#L111-L203)`
**功能说明**：项目文档、规范等知识性内容
**选择策略**：
- **指令文件自动注入**：AGENTS.md 等文件自动包含
- **就近原则**：优先使用项目根目录的指令文件
- **系统提醒格式**：以 `<system-reminder>` 标签注入

### 4.2 类别选择优先级

#### 4.2.1 优先级层次
1. **系统指令**（最高优先级）- 始终保留
2. **当前对话**（高优先级）- 强制保留
3. **最近工具反馈**（中优先级）- 时间窗口保护
4. **压缩摘要**（中优先级）- 替代原始对话
5. **历史对话**（低优先级）- 压缩边界截断
6. **旧工具反馈**（最低优先级）- 修剪候选

#### 4.2.2 选择算法矩阵

| 上下文类别 | 保留策略 | 压缩处理 | 修剪处理 | 优先级 |
|-----------|----------|----------|----------|--------|
| 系统指令 | 强制保留 | 不压缩 | 不修剪 | 最高 |
| 当前对话 | 时间窗口 | 部分压缩 | 不修剪 | 高 |
| 工具反馈 | Token 限制 | 不压缩 | 选择性修剪 | 中 |
| 文件内容 | 关联性 | 内容压缩 | 选择性修剪 | 中 |
| 知识库 | 指令驱动 | 不压缩 | 不修剪 | 中 |
| 历史对话 | 压缩边界 | 摘要替代 | 边界截断 | 低 |

### 4.3 智能选择策略

#### 4.3.1 基于任务类型的策略调整
- **编码任务**：优先保留代码文件和工具反馈
- **文档任务**：优先保留文档内容和指令
- **调试任务**：优先保留错误信息和工具输出

#### 4.3.2 基于会话阶段的策略调整
- **会话初期**：宽松保留，建立完整上下文
- **会话中期**：适度压缩，保持关键信息
- **会话后期**：严格修剪，聚焦当前任务

#### 4.3.3 基于模型能力的策略调整
- **大上下文模型**：减少压缩频率，保留更多历史
- **小上下文模型**：增加压缩频率，严格修剪
- **特殊能力模型**：根据模型特性调整策略

## 5. 技术优势总结

### 5.1 动态上下文管理
- **实时监控**：持续跟踪 Token 使用情况
- **自适应调整**：根据模型限制动态优化策略
- **渐进式压缩**：支持部分压缩，保持上下文连续性

### 5.2 智能选择机制
- **多层次策略**：压缩、修剪、边界截断等多重机制
- **类别化管理**：不同上下文类型采用差异化策略
- **优先级系统**：确保关键信息优先保留

### 5.3 可配置性和可扩展性
- **参数配置**：通过配置文件调整策略参数
- **插件支持**：支持自定义压缩和修剪策略
- **事件系统**：完善的压缩和修剪事件通知

### 5.4 异常处理能力
- **溢出检测**：及时检测上下文溢出情况
- **错误恢复**：支持压缩失败后的恢复机制
- **状态追踪**：完整的压缩状态记录和审计

## 6. 实际应用效果

OpenCode 的上下文选择机制在实际应用中表现出以下优势：

1. **长对话支持**：能够有效管理长达数小时的对话会话
2. **资源优化**：在有限的上下文窗口内最大化信息保留
3. **用户体验**：保持对话的连贯性和上下文相关性
4. **开发效率**：智能的上下文管理减少人工干预需求

## 结论

OpenCode 的上下文选择机制是一个高度智能化、多层次的管理系统，通过动态检测、压缩、修剪等策略，在有限的上下文窗口内实现了最优的信息保留效果。该机制不仅考虑了技术实现的效率，还充分考虑了用户体验和开发便利性，是现代 AI 助手上下文管理的优秀实践。

通过精细化的类别管理、智能的选择算法和灵活的配置选项，OpenCode 为长对话场景下的上下文管理提供了可靠的技术基础。