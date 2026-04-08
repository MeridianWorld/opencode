# OpenCode 前端请求机制对比分析

**生成工具**：TraeCN
**生成时间**：20260408 日
**文档类型**：技术分析文档

---

## 1. 概述

本文档详细分析了 webapp-previewer 前端和官方 web 前端（packages/app）如何与后端服务进行通信，对比两者的请求机制、SDK 使用方式和架构设计。

---

## 2. WebApp Previewer 前端请求机制

### 2.1 核心实现位置

**代码位置**：`[webapp-previewer/src/webapp-previewer/use-webapp-preview.ts](file:///d:/github_repo/opencode/webapp-previewer/src/webapp-previewer/use-webapp-preview.ts)`

**功能说明**：Web 应用预览功能的核心逻辑，负责检测 HTML 文件、生成预览 URL、处理资源路径

### 2.2 请求方式：原生 Fetch API

webapp-previewer 使用**原生 Fetch API** 直接与后端通信，没有使用 SDK 封装。

#### 2.2.1 文件验证请求

**代码位置**：`[use-webapp-preview.ts:L228-L240](file:///d:/github_repo/opencode/webapp-previewer/src/webapp-previewer/use-webapp-preview.ts#L228-L240)`

**功能说明**：使用 HEAD 方法验证文件是否存在

**技术细节**：
- 请求方法：`HEAD`（只获取响应头，不下载内容）
- 验证逻辑：检查 `response.ok` 和 `response.status === 200`
- 错误处理：捕获异常并记录警告日志

**代码示例**：
```typescript
// 验证文件是否存在
const response = await fetch(previewUrl, { method: 'HEAD' })
if (!response.ok || response.status !== 200) {
  // File doesn't exist, don't open preview
  console.warn('[WebAppPreview] File does not exist:', targetFile)
  return
}
```

#### 2.2.2 HTML 内容获取与修改

**代码位置**：`[use-webapp-preview.ts:L162-L216](file:///d:/github_repo/opencode/webapp-previewer/src/webapp-previewer/use-webapp-preview.ts#L162-L216)`

**功能说明**：获取 HTML 文件内容，注入 base tag 并修正资源路径

**技术细节**：
1. **获取 HTML 内容**：使用 `fetch().text()` 获取原始 HTML
2. **注入 Base Tag**：在 `<head>` 后添加 `<base href="...">` 标签
3. **修正资源路径**：使用正则表达式替换 CSS、JS、图片的相对路径
4. **创建 Blob URL**：将修改后的 HTML 转换为 blob URL 供 iframe 使用

**代码示例**：
```typescript
const injectBaseTag = async (htmlUrl: string, directory: string) => {
  try {
    const response = await fetch(htmlUrl)
    const html = await response.text()
    
    // 创建 base tag 指向 /view/ 端点
    const baseUrl = config().backendUrl.replace(/\/$/, "")
    const baseHref = `${baseUrl}/view/?directory=${encodeURIComponent(directory)}`
    const baseTag = `<base href="${baseHref}">`
    
    // 注入 base tag
    let modifiedHtml = html.replace('<head>', `<head>\n    ${baseTag}`)
    
    // 修正 CSS 资源路径
    modifiedHtml = modifiedHtml.replace(
      /<link([^>]*?)\s+href=["']?(?!https?:\/\/|\/|#)([^"'\s>]+)["']?([^>]*?)>/gi,
      `<link$1 href="${baseUrlForResources}$2?directory=${encodeURIComponent(directory)}"$3>`
    )
    
    // 创建 blob URL
    const blob = new Blob([modifiedHtml], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    
    return blobUrl
  } catch (error) {
    console.error('[WebAppPreview] Failed to inject base tag:', error)
    return htmlUrl
  }
}
```

#### 2.2.3 预览 URL 生成

**代码位置**：`[use-webapp-preview.ts:L145-L160](file:///d:/github_repo/opencode/webapp-previewer/src/webapp-previewer/use-webapp-preview.ts#L145-L160)`

**功能说明**：根据文件路径生成后端预览 URL

**技术细节**：
- 后端端点：`/view/{relativePath}`
- 查询参数：`directory`（项目根目录的 URL 编码）
- URL 格式：`http://localhost:4096/view/index.html?directory=C%3A%2FUsers%2F...`

**代码示例**：
```typescript
const generatePreviewUrl = (filePath: string) => {
  const directory = sync.directory || projectDir
  const relativePath = filePath.replace(directory + "/", "")
  const baseUrl = config().backendUrl.replace(/\/$/, "")
  
  return `${baseUrl}/view/${relativePath}?directory=${encodeURIComponent(directory)}`
}
```

### 2.3 请求流程图

```
┌─────────────────┐
│ WebApp Previewer│
│   (Frontend)    │
└────────────────┘
         │
         │ 1. fetch(htmlUrl)
         │    GET /view/index.html?directory=...
         ▼
┌─────────────────┐
│   Backend       │
│  (Port 4096)    │
│  /view/:path    │
└────────────────┘
         │
         │ 2. 返回 HTML 内容
         ▼
┌─────────────────┐
│ 修改 HTML        │
│ - 注入 base tag │
│ - 修正资源路径  │
│ - 创建 blob URL │
└────────┬────────┘
         │
         │ 3. iframe.src = blobUrl
         ▼
┌─────────────────┐
│   Iframe 渲染    │
│  (预览面板)     │
└─────────────────┘
```

### 2.4 特点总结

| 特性 | 实现方式 |
|------|---------|
| **请求库** | 原生 Fetch API |
| **认证** | 无（公开端点） |
| **数据格式** | HTML 文本、Blob |
| **错误处理** | try-catch + console.warn |
| **主要用途** | 静态文件预览、资源路径修正 |

---

## 3. 官方 Web 前端请求机制

### 3.1 核心实现位置

**代码位置**：`[packages/app/src/utils/server.ts](file:///d:/github_repo/opencode/packages/app/src/utils/server.ts)`

**功能说明**：创建 OpenCode SDK 客户端，用于与后端 API 通信

**技术细节**：
- SDK 包：`@opencode-ai/sdk/v2/client`
- 认证方式：Basic Auth（可选密码）
- 客户端类型：Type-safe API 客户端

### 3.2 SDK 客户端创建

**代码位置**：`[server.ts:L1-L22](file:///d:/github_repo/opencode/packages/app/src/utils/server.ts#L1-L22)`

**功能说明**：根据服务器配置创建 SDK 客户端

**技术细节**：
- **认证处理**：如果配置了密码，生成 Basic Auth 头
- **Base URL**：使用服务器 URL 作为基础地址
- **Headers 合并**：合并自定义 headers 和认证 headers

**代码示例**：
```typescript
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"

export function createSdkForServer({
  server,
  ...config
}: Omit<NonNullable<Parameters<typeof createOpencodeClient>[0]>, "baseUrl"> & {
  server: ServerConnection.HttpBase
}) {
  const auth = (() => {
    if (!server.password) return
    return {
      Authorization: `Basic ${btoa(`${server.username ?? "opencode"}:${server.password}`)}`,
    }
  })()

  return createOpencodeClient({
    ...config,
    headers: { ...config.headers, ...auth },
    baseUrl: server.url,
  })
}
```

### 3.3 SDK 客户端使用方式

官方前端通过 **SDK 封装的 API 方法** 发送请求，而不是直接使用 fetch。

#### 3.3.1 Session 相关请求

**代码位置**：`[packages/app/src/pages/session.tsx](file:///d:/github_repo/opencode/packages/app/src/pages/session.tsx)`

**功能说明**：会话管理相关操作（中止、恢复、更新等）

**调用示例**：
```typescript
// 中止会话
await sdk.client.session.abort({ sessionID })

// 恢复会话
await sdk.client.session.revert({ sessionID, messageID: message.id })

// 更新会话标题
await sdk.client.session.update({ sessionID: input.id, title: input.title })

// 创建 Git 任务
const task = sdk.client.vcs.task.create()
```

#### 3.3.2 全局 SDK 使用

**代码位置**：`[packages/app/src/context/global-sdk.tsx](file:///d:/github_repo/opencode/packages/app/src/context/global-sdk.tsx)`

**功能说明**：提供全局的 SDK 客户端，支持事件监听和自动重连

**技术细节**：
- **事件驱动**：通过 `createGlobalEmitter` 实现事件总线
- **自动重连**：内置重连机制（250ms 延迟）
- **请求合并**：使用队列和缓冲优化性能（16ms 刷新间隔）

**代码示例**：
```typescript
// 在 layout.tsx 中使用全局 SDK
const sessions: Session[] = await globalSDK.client.session.list({ directory })

// 更新项目
await globalSDK.client.project.update({ 
  projectID: project.id, 
  directory: project.worktree, 
  name 
})
```

#### 3.3.3 文件操作请求

**代码位置**：`[packages/app/src/pages/session/review-tab.tsx](file:///d:/github_repo/opencode/packages/app/src/pages/session/review-tab.tsx#L54)`

**功能说明**：文件读取操作

**代码示例**：
```typescript
const fileContent = await sdk.client.file
  .read({ path: filePath, directory })
```

### 3.4 服务器健康检查

**代码位置**：`[packages/app/src/utils/server-health.ts](file:///d:/github_repo/opencode/packages/app/src/utils/server-health.ts)`

**功能说明**：使用原生 fetch 检查服务器健康状态

**技术细节**：
- **超时控制**：使用 `AbortSignal.timeout(5000)` 或自定义超时
- **重试机制**：自动重试瞬态失败
- **缓存机制**：缓存健康检查结果（避免频繁请求）

**代码示例**：
```typescript
export async function checkServerHealth(
  http: ServerConnection.HttpBase,
  fetch: typeof globalThis.fetch,
  options?: {
    timeoutMs?: number
    signal?: AbortSignal
  }
) {
  try {
    const response = await fetch(`${http.url}/health`, {
      signal: AbortSignal.timeout(options?.timeoutMs ?? 5000),
    })
    const data = await response.json()
    return { healthy: true, version: data.version }
  } catch {
    return { healthy: false }
  }
}
```

### 3.5 请求流程图

```
┌─────────────────┐
│  Official App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ 1. sdk.client.session.abort({ sessionID })
         │    (SDK 封装的 API 调用)
         ▼
┌─────────────────┐
│  SDK Client     │
│ @opencode-ai/   │
│   sdk/v2/client │
└────────┬────────
         │
         │ 2. 内部使用 fetch
         │    POST /session/abort
         │    Headers: { Authorization: "Basic ..." }
         ▼
┌─────────────────┐
│   Backend       │
│  (Port 4096)    │
│  REST API       │
└────────┬────────┘
         │
         │ 3. 返回 JSON 响应
         ▼
┌─────────────────┐
│  SDK 处理响应    │
│ - 类型检查      │
│ - 错误处理      │
│ - 事件触发      │
└─────────────────┘
```

### 3.6 特点总结

| 特性 | 实现方式 |
|------|---------|
| **请求库** | @opencode-ai/sdk/v2/client（封装 fetch） |
| **认证** | Basic Auth（可选） |
| **数据格式** | JSON（Type-safe） |
| **错误处理** | SDK 内置错误处理 + 重试机制 |
| **主要用途** | API 调用、会话管理、文件操作 |

---

## 4. 对比分析

### 4.1 架构差异

| 维度 | WebApp Previewer | 官方 Web 前端 |
|------|-----------------|--------------|
| **请求方式** | 原生 Fetch API | SDK 封装（@opencode-ai/sdk） |
| **复杂度** | 简单直接 | 复杂封装 |
| **类型安全** | 无（动态类型） | 有（TypeScript 类型） |
| **认证支持** | 无 | Basic Auth |
| **事件驱动** | 无 | 有（全局事件总线） |
| **自动重连** | 无 | 有 |
| **请求合并** | 无 | 有（16ms 缓冲） |

### 4.2 使用场景

#### WebApp Previewer 适用场景
- ✅ 简单的静态文件获取
- ✅ HTML 内容修改和注入
- ✅ 不需要认证的公开端点
- ✅ 一次性请求（非实时通信）

#### 官方前端适用场景
- ✅ 复杂的 API 交互（会话管理、文件操作）
- ✅ 需要类型安全的场景
- ✅ 实时事件监听（如会话更新）
- ✅ 需要认证的场景
- ✅ 需要重试和容错的场景

### 4.3 代码风格对比

**WebApp Previewer（简单直接）**：
```typescript
// 直接 fetch + 手动处理
const response = await fetch(url)
const html = await response.text()
const modifiedHtml = html.replace(...)
```

**官方前端（SDK 封装）**：
```typescript
// SDK 方法调用
await sdk.client.session.update({ sessionID, title })

// 底层仍然是 fetch，但封装了类型和错误处理
```

---

## 5. 技术细节

### 5.1 Fetch API 使用差异

#### WebApp Previewer
```typescript
// 1. 获取 HTML 内容
const response = await fetch(htmlUrl)
const html = await response.text()

// 2. 验证文件存在性
const headResponse = await fetch(previewUrl, { method: 'HEAD' })
if (!headResponse.ok) { /* 处理错误 */ }
```

#### 官方前端
```typescript
// 1. SDK 封装（底层使用 fetch）
const result = await sdk.client.session.messages({ 
  directory, 
  sessionID, 
  limit: prefetchChunk 
})

// 2. 直接使用 fetch（健康检查）
const response = await fetch(`${http.url}/health`, {
  signal: AbortSignal.timeout(5000),
})
```

### 5.2 错误处理对比

#### WebApp Previewer
```typescript
try {
  const response = await fetch(htmlUrl)
  const html = await response.text()
  // ... 处理 HTML
} catch (error) {
  console.error('[WebAppPreview] Failed:', error)
  return htmlUrl // 降级处理
}
```

#### 官方前端
```typescript
// SDK 内置错误处理
try {
  await sdk.client.session.revert({ sessionID, messageID })
} catch (error) {
  // 使用平台通知系统
  platform.notify({
    title: language.t("error.revertFailed"),
    description: error.message,
  })
}
```

### 5.3 认证机制

#### WebApp Previewer
- **无认证**：访问公开的 `/view/` 端点
- **安全性**：依赖后端的路径安全检查

#### 官方前端
- **Basic Auth**：可选的用户名/密码认证
- **认证头生成**：
  ```typescript
  const auth = {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
  }
  ```

---

## 6. 总结

### 6.1 WebApp Previewer 请求机制
- **优点**：简单、直接、易于理解和调试
- **缺点**：缺乏类型安全、无认证、无重试机制
- **适用**：简单的静态文件预览场景

### 6.2 官方前端请求机制
- **优点**：类型安全、认证支持、事件驱动、自动重连
- **缺点**：复杂度高、依赖 SDK 包
- **适用**：复杂的 API 交互和实时通信场景

### 6.3 建议

如果你需要在 webapp-previewer 中增加更复杂的 API 交互，可以考虑：

1. **保持现状**：如果只需要简单的文件获取，原生 fetch 足够
2. **使用 SDK**：如果需要与会话管理、文件操作等 API 交互，可以引入 `@opencode-ai/sdk`
3. **混合使用**：静态资源用 fetch，API 调用用 SDK

---

## 7. 参考文件

### WebApp Previewer
- [`use-webapp-preview.ts`](file:///d:/github_repo/opencode/webapp-previewer/src/webapp-previewer/use-webapp-preview.ts) - 核心请求逻辑
- [`previewer.tsx`](file:///d:/github_repo/opencode/webapp-previewer/src/webapp-previewer/previewer.tsx) - 预览面板组件

### 官方前端
- [`server.ts`](file:///d:/github_repo/opencode/packages/app/src/utils/server.ts) - SDK 客户端创建
- [`global-sdk.tsx`](file:///d:/github_repo/opencode/packages/app/src/context/global-sdk.tsx) - 全局 SDK 上下文
- [`server-health.ts`](file:///d:/github_repo/opencode/packages/app/src/utils/server-health.ts) - 服务器健康检查
- [`session.tsx`](file:///d:/github_repo/opencode/packages/app/src/pages/session.tsx) - Session API 使用示例
- [`layout.tsx`](file:///d:/github_repo/opencode/packages/app/src/pages/layout.tsx) - 全局 SDK 使用示例
