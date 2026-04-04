# opencode-context-kanban 测试报告

测试时间：2026-04-04

测试人：Codex

测试环境：
- Windows PowerShell
- 前端地址：`http://localhost:5175/`
- 后端地址：`http://localhost:8000/`
- 浏览器自动化：Playwright（Chromium，真实浏览器渲染）

测试方式：
- 现场联调测试：直接访问已启动的前后端服务
- 浏览器受控场景测试：在真实浏览器中注入 mock WebSocket，验证 `message.removed`、`session.compacted`、多 Session 切换等边界场景
- 接口连通性检查：直接检查前端、后端、上游 SSE 端点可用性

测试产物：
- `docs/test-artifacts/live-desktop.png`
- `docs/test-artifacts/live-mobile.png`
- `docs/test-artifacts/mock-desktop.png`

## 一、结论

当前版本可以打开页面、连接本地后端、展示最近 20 个 Session 标题，但核心价值链路没有跑通：现场环境下看板没有拿到消息、Token 和时间线数据，导致主面板几乎始终为空。除此之外，在受控浏览器测试里还确认了几个前端实现问题，包括：
- `message.removed` 增量事件不会真正从状态树中删除消息
- `session.compacted` 没有实现差异视图
- 移动端存在横向溢出
- 图表初始化会持续产生尺寸告警
- 开发模式下存在重复 WebSocket 连接

整体判断：`可访问，但未达到可用的调试看板标准`。

## 二、测试范围与结果

| ID | 场景 | 方式 | 结果 | 说明 |
| :-- | :-- | :-- | :-- | :-- |
| T01 | 前端页面可访问 | 现场浏览器 | 通过 | `http://localhost:5175/` 返回 200，页面可渲染 |
| T02 | 后端服务可访问 | 现场接口 | 通过 | `http://localhost:8000/docs` 返回 200 |
| T03 | 上游 SSE 可访问 | 现场接口 | 失败 | `http://localhost:4096/event` 无法连接 |
| T04 | WebSocket 初始快照下发 | 现场接口 | 通过 | `/ws` 能收到 `snapshot` 消息 |
| T05 | 现场 Session 列表展示 | 现场浏览器 | 通过 | 页面展示 20 个 Session 标题 |
| T06 | 现场消息/Token/Timeline 展示 | 现场浏览器 | 失败 | 主区域显示 `Messages=0`、`Tokens=0`、Timeline 为空 |
| T07 | Session 切换 | 浏览器 mock | 通过 | 切换后消息数、Token 数、时间线过滤正常变化 |
| T08 | `message.removed` 详情 diff 展示 | 浏览器 mock | 通过 | 点击后可见 `Message Truncated / Pruned` |
| T09 | `message.removed` 增量删除是否更新状态 | 浏览器 mock | 失败 | 时间线增加了事件，但消息数没有从 2 变成 1 |
| T10 | `session.compacted` 差异视图 | 浏览器 mock | 失败 | 只有 JSON 详情，没有压缩前后 diff |
| T11 | 移动端布局 | 现场浏览器 | 失败 | `390px` 视口下存在横向溢出 |
| T12 | 控制台健康度 | 现场浏览器 | 失败 | 图表尺寸告警重复出现，WebSocket 连接日志重复 |

## 三、关键证据

### 1. 现场页面现状

现场浏览器打开后，左侧能看到最近 Session 标题，但主区域为：
- `Total Session Tokens = 0`
- `Messages = 0`
- `Event Timeline` 为空

这和产品目标不符。根因证据如下：
- 后端日志持续报错：无法连接 `http://localhost:4096/event`
- 直接请求 `http://localhost:4096/event` 失败
- 直接连接 `ws://localhost:8000/ws` 收到的 `snapshot` 中：
  - `sessions` 有 20 条
  - `messages` 为空
  - `parts` 为空
  - `timeline` 为空

### 2. 浏览器控制台证据

现场浏览器控制台稳定出现两类异常信号：
- 重复日志：`Connected to backend WS`
- 图表警告：`The width(-1) and height(-1) of chart should be greater than 0`

这说明即使页面能打开，前端在连接管理和图表初始化上也存在实现问题。

### 3. 移动端证据

在 `390 x 844` 视口下，页面指标为：
- `innerWidth = 390`
- `scrollWidth = 391`
- `hasHorizontalOverflow = true`

说明当前布局并没有真正适配移动端。

### 4. 受控浏览器场景证据

在 mock WebSocket 场景下：
- 初始 `Session One` 显示 `Messages = 2`、`Tokens = 30`
- 切换到 `Session Two` 后显示 `Messages = 1`、`Tokens = 7`
- 点击 `message.removed` 事件后，能看到 diff 区块
- 但当再次推送一个新的 `message.removed` 增量事件时：
  - 时间线条目从 `2` 增加到 `3`
  - 消息数仍然停留在 `2`

这证明前端只把删除事件记进了时间线，没有真正更新 Session 状态树。

## 四、问题清单

### P1. 现场核心链路未跑通，主面板没有真实上下文数据

严重性：高

现象：
- 页面可打开
- Session 列表可见
- 但消息、Token、Timeline 全为空

证据：
- 后端日志里反复出现 `SSE connection failed`
- `http://localhost:4096/event` 无法连接
- WebSocket `snapshot` 仅包含 Session 元数据，不包含消息和时间线

影响：
- 当前现场版本无法承担“上下文可视化调试看板”的核心职责

备注：
- 这一项既包含环境依赖问题，也暴露了应用没有提供降级说明或明显错误提示

### P1. `message.removed` 增量事件不会更新消息状态

严重性：高

复现：
1. 用 mock WebSocket 打开页面，初始化一个包含 2 条消息的 Session
2. 推送新的 `message.removed` 事件
3. 观察消息计数

实际结果：
- Timeline 增加了删除事件
- 消息总数没有减少

预期结果：
- 被删除的消息应从状态树中移除
- 消息数、Token 汇总、后续图表都应同步更新

根因定位：
- `frontend/src/store/useStore.ts` 只处理了 `session.created/session.updated`、`message.updated`、`message.part.updated`
- 注释里写了 `// etc... handling removed`，但实际上未实现删除逻辑

### P2. `session.compacted` 没有实现差异视图

严重性：中

现象：
- `session.compacted` 事件可以出现在时间线里
- 点击后只能看到 JSON 详情
- 没有压缩前后 diff 或任何“被裁剪内容”的可视化

影响：
- 无法满足 PRD 中对 Compaction/Prune 可视化差异的要求

### P2. 移动端存在横向溢出

严重性：中

现象：
- `390px` 宽度下页面出现横向滚动

推测原因：
- 根布局使用固定侧栏宽度 `w-64`
- 下半区又使用左右各 `w-1/2`
- 没有为窄屏提供折叠、堆叠或滚动策略

### P2. 图表初始化尺寸异常，控制台持续告警

严重性：中

现象：
- 页面加载时重复出现 `width(-1)` / `height(-1)` 告警

影响：
- 暗示图表容器在首次布局时没有稳定尺寸
- 会污染控制台，并可能造成首次渲染抖动或空图

### P2. 开发模式下存在重复 WebSocket 连接

严重性：中

证据：
- 现场浏览器控制台输出两次 `Connected to backend WS`
- 受控浏览器场景下统计到创建了 3 个 WebSocket 实例

推测原因：
- `frontend/src/main.tsx` 使用了 `StrictMode`
- `Dashboard.tsx` 中 `useEffect(() => { connect() }, [connect])` 没有清理逻辑
- `useStore.ts` 的 `connect()` 每次都会新建 WebSocket，也没有去重保护

影响：
- 可能导致重复订阅、重复事件、额外资源消耗

## 五、建议修复顺序

1. 先解决现场可用性问题：确认 `opencode` 上游事件流是否必须由外部进程启动，并在 UI 中明确展示“上游未连接”的状态与错误原因。
2. 完整实现 `message.removed` 和 `message.part.removed` 的状态更新逻辑，保证删除/裁剪后统计数据正确。
3. 补齐 `session.compacted` 的差异视图与裁剪内容展示。
4. 修复 WebSocket 重复连接问题，为 `connect()` 增加单例保护和清理逻辑。
5. 调整布局与图表容器，消除移动端溢出和 Recharts 尺寸告警。

## 六、附加说明

本次测试没有修改业务代码，只新增了测试报告和浏览器截图产物。报告中的失败项分为两类：
- 现场真实失败：直接在已启动服务上复现
- 受控浏览器失败：通过真实浏览器注入 mock WebSocket 复现前端状态管理缺陷

两类问题都应进入修复清单，其中现场真实失败优先级最高。
