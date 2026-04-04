# 需求文档 (PRD)

**产品名称**：Agent Context Dashboard (上下文可视化看板)
**产品定位**：本地化 AI 开发者调试工具
**目标用户**：使用或开发 `opencode` 的工程师，需要深究 Agent Context 组装与流转机制的人员。

说明：以下状态区分“代码能力是否已实现”与“本轮现场是否已验证”。当前本轮现场环境中，上游 `http://localhost:4096/event` 仍不可达，因此涉及真实上游事件流的能力仍受环境阻塞。

## 核心功能列表 (P0):

1. **本地会话实时同步 [部分完成]**
   - 看板需实时获取本机正在运行的 `opencode` 实例产生的事件。（代码已具备：后端连接上游 SSE，前端处理 WebSocket 数据，并增加重连状态提示）
   - 本轮现场验证结果：当前上游 `4096` 事件流未连通，因此只验证了断连提示与降级状态，未完成真实事件流验收。
   - 支持多会话（Sessions）并行监控，侧边栏能够自由切换不同的 Session。

2. **上下文流向图 (Context Event Timeline) [已完成]**
   - 时间线记录每一个事件点：如 `message.updated`、`message.part.updated`（工具执行、Token 增加）、`message.removed`（裁剪截断，前端同步更新状态与统计）、`session.compacted`（会话级压缩）。
   - 本轮已通过真实浏览器和 mock 事件验证切换 Session、删除事件同步和时间线详情展示。

3. **Token 消耗监控面板 [已完成]**
   - 实时展示当前 Session 下所有 Message 累计占用的 Token 数（Input / Output / Cache 读取 / Cache 写入）。（已实现：包括 `message.removed` 后的同步更新）
   - 提供 Token 趋势折线图，标注出断崖式下跌的节点（代表发生了 Prune 或 Compaction）。（已实现：修复了初始化尺寸告警问题，改为在容器宽度可测量后再绘制图表）

4. **增量/裁剪 Diff 视图 [部分完成]**
   - 在发生截断或动态裁剪时（比如长文本 Tool Output 截断 或 Compaction），能够在详情页以代码 Diff 形式展示被丢弃或替换的具体内容。
   - 已实现：`session.compacted` 差异视图已上线并完成浏览器验证。
   - 待完善：更细粒度的 Tool Output 截断 / Prune 差异展示仍未补齐。

## 额外优化特性：

- **响应式与移动端适配 [已完成]**：修复移动端横向溢出问题，侧栏与统计区适配小屏。
- **WebSocket 稳定性优化 [已完成]**：修复 React StrictMode 下的重复连接问题。
- **状态可见性优化 [已完成]**：上游 SSE 未连接或无数据时，前端具备明确的状态反馈与提示。
