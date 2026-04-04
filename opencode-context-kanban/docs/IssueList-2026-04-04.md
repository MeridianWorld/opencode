# opencode-context-kanban 问题清单

测试时间：2026-04-04

问题 1：现场核心链路未跑通。前端页面和后端接口可访问，但上游 `http://localhost:4096/event` 无法连接，导致页面只能展示 Session 标题，`Messages`、`Total Session Tokens` 和 `Event Timeline` 均为空。

修复建议：先确认 `opencode` 事件源是否已正确启动并监听 `4096` 端口；在后端增加更明确的连接失败日志与重连状态；在前端增加显式错误提示和空态说明，不要只显示空白主面板。

问题 2：`message.removed` 增量事件没有真正更新前端状态树。时间线会新增删除事件，但消息数不会减少，Token 统计也不会同步变化。

修复建议：在 [useStore.ts](D:/github_repo/opencode/opencode-context-kanban/frontend/src/store/useStore.ts) 中补全 `message.removed` 和 `message.part.removed` 的状态处理逻辑，删除对应消息或 part，并重新驱动消息统计和图表数据。

问题 3：`session.compacted` 没有实现差异视图。点击这类事件只能看到原始 JSON，看不到压缩前后内容差异。

修复建议：在 [Dashboard.tsx](D:/github_repo/opencode/opencode-context-kanban/frontend/src/components/Dashboard.tsx) 中为 `session.compacted` 增加专门的 diff 渲染逻辑，并在后端准备压缩前后摘要或可比对内容。

问题 4：移动端存在横向溢出。`390px` 视口下页面宽度超出屏幕，出现横向滚动。

修复建议：为侧栏、统计区和下半区增加响应式布局；小屏下改为纵向堆叠或抽屉式侧栏；避免固定 `w-64` 与双栏 `w-1/2` 在窄屏下同时生效。

问题 5：图表初始化时持续出现尺寸告警。浏览器控制台重复输出 `width(-1)` / `height(-1)` 相关警告。

修复建议：检查图表容器在首次渲染时是否具有稳定高度；必要时为图表外层增加明确高度和 `min-width/min-height`；避免在容器尺寸未确定时渲染 `ResponsiveContainer`。

问题 6：开发模式下存在重复 WebSocket 连接。浏览器控制台会重复打印 `Connected to backend WS`，说明可能发生重复订阅。

修复建议：在 [main.tsx](D:/github_repo/opencode/opencode-context-kanban/frontend/src/main.tsx) 的 `StrictMode` 环境下，为 [useStore.ts](D:/github_repo/opencode/opencode-context-kanban/frontend/src/store/useStore.ts) 的 `connect()` 增加单例保护、重复连接拦截和清理逻辑，避免重复创建 WebSocket。

问题 7：页面在上游无数据时缺少可操作反馈。当前用户只能看到空白统计区，无法判断是“暂无数据”还是“链路异常”。

修复建议：补充状态提示文案，例如“后端已连接，但上游事件流未连接”或“尚未接收到消息事件”；同时增加手动重试或刷新状态入口。

问题 8：测试文档与现场行为有明显差距。设计文档和测试用例中要求展示上下文差异、Token 趋势和裁剪可视化，但现场版本尚未满足。

修复建议：按 PRD 和 TestCases 将能力拆分为可验收项，逐条补齐实现，并把“已完成/未完成”状态同步回文档，避免文档先行但功能未落地。
