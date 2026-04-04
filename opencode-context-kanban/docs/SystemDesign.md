# 系统设计与架构文档 (System Design Doc)

## 1. 架构概览

基于对 `opencode` 代码的阅读，内置的 HTTP Server（在端口 `4096`）通过 Server-Sent Events (SSE) 推送所有内部事件流（`GET /event`）。
因此，我们将采用以下 B/S 架构，包含 Python 中继后端和 React 前端。

### 1.1 系统组件拆解

- **数据源 (`opencode` CLI)**:
  - 无需修改 `opencode` 核心代码。
  - 自带 `http://localhost:4096/event` 的 SSE (text/event-stream) 接口，广播所有 Context 增删改查事件。

- **中继与处理后端 (Python Backend)**:
  - **框架选型**：`FastAPI` (原生支持异步和 WebSocket)。
  - **职责**：
    1.  启动后台异步任务（如 `httpx` / `aiohttp`）长连接 `http://localhost:4096/event` 监听 SSE 流。
    2.  将接收到的增量事件 (`message.updated`, `message.removed` 等) 进行解析和清洗。
    3.  在内存中维护当前各个 Session 的“上下文状态树（状态副本）”。
    4.  对前端暴露 WebSocket 服务（`ws://localhost:8000/ws`）。当前端建立连接后，先下发当前状态树（Snapshot），然后实时透传增量更新事件。

- **可视化前端 (React Frontend)**:
  - **框架选型**：React + Vite + TailwindCSS。
  - **图表/Diff 库**：使用 Recharts 或 ECharts（绘制 Token 曲线），使用 `react-diff-viewer` 或 `monaco-editor`（展示上下文截断的差异）。
  - **职责**：通过 WebSocket 与 Python 后端通信，渲染 Timeline、总览指标和 Diff 弹窗。

## 2. 核心数据流转 (State Sync)

Python 后端作为中转，负责拼接来自 opencode 的增量流，重构出可用于前端渲染的状态快照。

1.  **`message.updated`**: Python 在内存记录中更新/添加该消息，同时记录该消息自带的 Token 指标。
2.  **`message.part.updated`**: 累加工具调用、中间思考输出等状态到对应的 Message 中。
3.  **`message.removed` / `session.compacted`**: 后端发现某个消息被移除或整个会话发生 Compaction 时，计算出被删除的文本或 Token，并向前端派发附带 Diff 数据或标记的 `ContextPrunedEvent`。
