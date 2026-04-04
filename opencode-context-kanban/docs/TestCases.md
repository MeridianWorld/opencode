# 测试文档 (Test Cases Draft)

说明：本表中的“状态”表示 2026-04-04 这一轮实际测试后的结果，不等同于“代码是否已经具备该能力”。

| 用例 ID | 模块            | 验证场景         | 前置条件                        | 操作步骤                                               | 预期结果                                                                                                                                      | 状态                                       |
| :------ | :-------------- | :--------------- | :------------------------------ | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| TC-01   | 后端链路        | 核心 SSE 监听    | `opencode` 服务开启在 4096 端口 | 启动 Python FastAPI 服务                               | 控制台打印 "Successfully connected to opencode event stream"，并持续接收心跳包 (`server.heartbeat`)                                           | [受环境阻塞] 本轮现场 `4096` 未连通        |
| TC-02   | 前端链路        | WebSocket 握手   | Python 后端运行中               | 打开 React 前端 Dashboard                              | 侧边栏立即展示出历史的 Sessions（由 Python 服务下发状态树）                                                                                   | [已完成]                                   |
| TC-03   | 实时流同步      | 增量消息渲染     | Dashboard 打开且建立连接        | 在 CLI 中对 `opencode` 输入："写一个 python 脚本"      | Dashboard 自动选中最新 Session，Timeline 实时打出 `User Message` 和 `Assistant Message(Thinking/Tool...)` 的记录，Token 曲线向上攀升          | [受环境阻塞] 本轮未拿到真实上游消息流      |
| TC-04   | 截断捕获 (Diff) | Compaction/Prune | Dashboard 持续监控当前对话      | 制造一个长对话，触发 `opencode` 的自动 `Compaction`    | Dashboard 收到事件后，Token 曲线断崖下跌，Timeline 出现红色的 "Context Compacted"，点击后弹出的 Diff 视图清楚显示哪些旧对话被压缩成了 Summary | [部分完成] Compaction 已实现，Prune 待完善 |
| TC-05   | 健壮性          | Opencode 重启    | 正常使用中                      | 在终端强制 `Ctrl+C` 关掉 `opencode` 后再重新 `bun run` | Python 后端捕获到断连，并在恢复后重新同步最新的 Session 列表；前端提示 "Connection Restored"                                                  | [未验证] 本轮未执行完整重启场景            |
