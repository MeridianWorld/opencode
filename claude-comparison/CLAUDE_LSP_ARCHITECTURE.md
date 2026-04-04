# Claude Code LSP (Language Server Protocol) 集成分析

## 📋 概述

Claude Code 将 Language Server Protocol (LSP) 作为核心功能之一，旨在为 LLM (大语言模型) 提供人类开发者在使用 IDE 时所享有的高级代码智能能力（如：跳转定义、查找引用、查看悬浮提示、调用层级分析等）。

与简单地读取或全局正则搜索(grep)代码不同，LSP 集成使 Claude 能够**基于 AST 和语义**理解代码仓库，极大提升了模型处理大规模、复杂重构和上下文导航的能力。

## 🏗️ 整体架构图

LSP 系统在 Claude Code 中主要分为 5 个逻辑层：

```text
┌─────────────────────────────────────────────────────────┐
│                 LLM Context & Query Engine                │
│ (query.ts, attachments.ts: 自动附带 Diagnostics)             │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                       Tool System                         │
│ (LSPTool.ts: 暴露 9 种智能查询能力)                           │
│ (FileEditTool/FileWriteTool: 触发代码变更同步 changeFile)       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 LSP Server Manager                        │
│ (LSPServerManager.ts: 路由扩展名、维护多语言实例、文件状态)      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 LSP Server Instance                       │
│ (LSPServerInstance.ts: 进程生命周期、健康检查、崩溃恢复)        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                     LSP Client                            │
│ (LSPClient.ts: 基于 vscode-jsonrpc/node，经由 stdio 通信)    │
└─────────────────────────────────────────────────────────┘
```

## 🔧 核心环节与处理流程

### 1. LSP 服务的发现与启动 (Plugin Driven)

**Claude Code 自身并没有硬编码任何 LSP Server（如 `tsserver` 或 `pyright`），而是依赖其内置的“插件系统 (Plugin System)”。**

- **配置加载**：系统启动或初始化时，`src/services/lsp/config.ts` 会加载所有启用的插件。如果插件目录中包含 `.lsp.json` 或 `manifest.lspServers`，系统就会解析这些配置。
- **服务映射**：在 `LSPServerManager` 中，系统会根据配置中的 `extensionToLanguage`（例如：将 `.ts` 映射给 `typescript` 服务器），构建一个全局的“文件扩展名 -> LSP 服务实例”的路由表。
- **按需启动**：LSP 进程并不会在 Claude Code 启动时立即拉起，而是采用**延迟加载 (Lazy Load)** 策略。只有当模型第一次查询某个特定文件（如 `.ts` 文件）时，相应的 Server Process 才会被 spawn（衍生）出来 (`LSPClient.start`)。

### 2. 文件状态同步 (VFS Synchronization)

为了确保 LSP Server 内部构建的语法树与 Claude 的当前编辑状态保持绝对一致，Claude Code 实现了文件系统同步：

- **文件打开 (`openFile`)**：当模型通过 `LSPTool` 查询某文件时，工具会检查该文件是否在 LSP 中标记为已打开。如果没有，它会读取本地文件并向 LSP 发送 `textDocument/didOpen` 协议消息。
- **文件变更 (`changeFile`)**：当模型使用 `FileEditTool` 或 `FileWriteTool` 修改了代码，工具除了将代码写入本地磁盘外，还会**主动调用** `lspManager.changeFile(filePath, content)`，这会触发 `textDocument/didChange` 消息。
  - **优势**：LLM 不需要等待 LSP server 缓慢地监控本地文件系统变动，LSP 服务器的状态是实时与 LLM 的“工作区”保持同步的。

### 3. LLM 的主被动交互 (LSP Tool & Diagnostics)

LSP 系统与 LLM 的交互分为“主动请求”和“被动通知”两条路径。

#### 主动请求 (LSPTool.ts)
Claude Code 暴露了一个名为 `LSP` 的专用工具给大模型。它支持 **9 种** 常见的语义分析操作：

1. `goToDefinition`: 跳转到定义
2. `findReferences`: 查找所有引用
3. `hover`: 获取悬浮信息（类型信息、文档注释）
4. `documentSymbol`: 获取文档内的所有符号（函数、类、变量等）
5. `workspaceSymbol`: 在整个工作区内全局搜索符号
6. `goToImplementation`: 跳转到接口或抽象类的具体实现
7. `prepareCallHierarchy`: 准备调用层级分析
8. `incomingCalls`: 查找谁调用了指定位置的函数 (基于前置的 prepareCallHierarchy)
9. `outgoingCalls`: 查找指定位置的函数内部调用了哪些函数

模型在规划复杂重构时，可以反复调用这个工具（输入 `filePath`, `line`, `character`），而结果会被专门的 formatter 转换为友好的纯文本供模型理解。

#### 被动通知 (LSPDiagnosticRegistry.ts)
LSP Server 通常会在后台持续对打开的文件进行语法检查和 Lint，并下发 `textDocument/publishDiagnostics` 通知。
- **捕获与缓存**：Claude Code 使用 `LSPDiagnosticRegistry.ts` 监听这些错误/警告。由于诊断信息可能会大量产生，Registry 使用了 `LRUCache` 和 Hash 算法进行**去重控制**和**数量限流**（避免撑爆模型的上下文窗口）。
- **注入上下文**：在 LLM 的查询循环 (`QueryEngine`) 中，`src/utils/attachments.ts` 中的 `getLSPDiagnosticAttachments()` 会被自动调用。如果有待处理的诊断信息（如语法错误、类型不匹配），它们会被包装成特殊的 `Attachment`（附件）直接追加给 LLM。
- **自发纠错 (Self-Correction)**：这让 Claude 获得了一种“类似人类IDE”的体验：刚写完一段错误代码，无需手动跑测试，IDE 的红线报错就直接反馈给了 Claude，它进而可以立即触发下一轮的修复。

### 4. 进程与错误恢复控制 (LSPServerInstance)

- **底层协议**：通信基于微软官方的 `vscode-jsonrpc` 和 `vscode-languageserver-protocol` 包，进程间采用 standard I/O (管道) 通信。
- **暂态错误处理**：LSP 经常会返回诸如 `LSP_ERROR_CONTENT_MODIFIED (-32801)` 之类的状态（例如 Rust-Analyzer 正在索引中无法响应）。`LSPServerInstance` 会进行 Exponential Backoff（指数退避）重试，最大重试次数默认为 3 次。
- **崩溃重启**：如果 LSP Server 崩溃（Exit code != 0），系统将标记其为 error 状态，并在 LLM 下一次尝试调用该服务时重新 spawn 进程。

## 🎯 总结

Claude Code 将 LSP 设计为系统中极为重要的“感官”：
1. **LSPTool** 是模型的“眼睛”，用来在复杂的代码库中精准导航。
2. **FileEdit/Write Tool** 扮演“手”，同时即时通知 LSP 自己的改动。
3. **LSPDiagnostics** 充当了“条件反射式的痛觉”，在编写错代码后能立即、异步地中断并反馈给模型进行自我修复。

整个系统完全插件化，解耦了对具体语言的依赖，这是该命令行工具具备“专业工程师”般分析能力的底层基石。