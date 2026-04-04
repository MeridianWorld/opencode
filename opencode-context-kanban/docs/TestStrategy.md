# 测试方案 (Test Strategy)

这是一个严格的开发者调试工具，它必须具备在大量 Log 刷屏时保持 UI 稳定的能力。

## 1. 核心测试维度

- **全链路连通性测试 (Integration Test)**：确保 Python 后端能够稳定长连接 `opencode` 的 `/event` 数据流（SSE），且中途掉线后能够自动重连（Auto-reconnect）。
- **状态一致性测试 (State Consistency)**：Python 维护的上下文内存树，必须与实际 `opencode` Agent 的状态（如 `Message`、`Session`、`Token` 等）在事件驱动下保持一致。
- **UI 性能测试 (Performance)**：模拟短时间内大量（如10秒内）接收 `message.part.updated`（代表 Agent 疯狂输出大段代码或调用长输出工具），测试前端图表、Timeline 滚动条和 Diff 视图是否会卡顿掉帧或内存溢出（OOM）。
