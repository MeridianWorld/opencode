# 需求文档 (PRD)

**产品名称**：Agent Context Dashboard (上下文可视化看板)
**产品定位**：本地化 AI 开发者调试工具
**目标用户**：使用或开发 `opencode` 的工程师，需要深究 Agent Context 组装与流转机制的人员。

## 核心功能列表 (P0):

1. **本地会话实时同步**
   - 看板需实时获取本机正在运行的 `opencode` 实例产生的事件。
   - 支持多会话（Sessions）并行监控，侧边栏能够自由切换不同的 Session。

2. **上下文流向图 (Context Event Timeline)**
   - 时间线记录每一个事件点：如 `message.updated`, `message.part.updated`（工具执行、Token 增加）、`message.removed`（裁剪截断）、`session.compacted`（会话级压缩）。

3. **Token 消耗监控面板**
   - 实时展示当前 Session 下所有 Message 累计占用的 Token 数（Input / Output / Cache 读取 / Cache 写入）。
   - 提供 Token 趋势折线图，标注出断崖式下跌的节点（代表发生了 Prune 或 Compaction）。

4. **增量/裁剪 Diff 视图**
   - 在发生截断或动态裁剪时（比如长文本 Tool Output 截断 或 Compaction），能够在详情页以代码 Diff 形式展示被丢弃或替换的具体内容。
