# 任务计划：分析 OpenCode 的 agent 规划、工具调用与多轮对话实现

## 目标
- 基于仓库代码与现有 specs，总结 OpenCode 作为 coding agent 的：任务拆解/规划（planning）、工具调用（tool use）、多轮对话/循环（multi-turn）。
- 输出 3 份独立中文文档（markdown），便于阅读与引用，包含关键代码链接与流程图。

## 产出物
- specs/opencode_agent_planning.zh.md
- specs/opencode_tool_use.zh.md
- specs/opencode_multi_turn_dialogue.zh.md

## 阶段
### Phase 1：建立索引（进行中）
- 定位 agent loop、plan/todo、max steps、队列消息等关键入口
- 定位 tool registry / tool schema / tool descriptions 的装配路径
- 定位 session message 存储、compaction、summary 的关键逻辑

### Phase 2：阅读与归纳
- 阅读关键文件，记录发现到 findings.md
- 画出“从用户输入 → agent loop → 工具 → 模型 → 写回消息”的链路

### Phase 3：撰写三份文档
- 以“概念 → 组件 → 数据结构 → 关键流程 → 扩展点/配置项”为结构
- 每个结论附关键代码引用（file:// 链接 + 行号范围）

### Phase 4：自检
- 与现有 specs/prompt_analysis.zh.md 对齐，避免重复与矛盾
- 交叉验证：文档中的关键函数/文件是否存在且职责匹配
