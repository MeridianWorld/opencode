# OpenCode WebApp Previewer

**生成工具**：TraeCN  
**生成时间**：20260408 日 19:57  
**文档类型**：功能说明文档

---

## 概述

OpenCode WebApp Previewer 是基于官方 OpenCode Web 前端（packages/app）的增强版本，添加了实时 Web 应用预览功能。当 OpenCode 生成 Web 应用（HTML 文件）时，该功能会自动检测并在嵌入式预览面板中显示。

## 主要特性

### 1. 实时预览
- 自动检测项目中生成的 HTML 文件
- 在嵌入式 iframe 中实时预览 Web 应用
- 支持自动预览模式，生成 HTML 后自动打开预览面板

### 2. 多设备预览
提供三种设备模式，方便测试响应式设计：
- **Desktop**（桌面）：100% 宽度
- **Tablet**（平板）：768px 宽度
- **Mobile**（手机）：375px 宽度

### 3. 智能检测
- 自动扫描项目目录中的 `.html` 和 `.htm` 文件
- 支持文件变化监听（待实现完整功能）
- 可手动选择要预览的文件

### 4. 用户友好界面
- 深色主题，与 OpenCode 原生界面保持一致
- 流畅的动画过渡效果
- 支持在新标签页中打开预览

## 目录结构

```
webapp-previewer/
├── src/
│   ├── webapp-previewer/       # 新增的预览功能模块
│   │   ├── index.ts            # 模块导出
│   │   ├── types.ts            # 类型定义
│   │   ├── use-webapp-preview.ts  # Preview Hook
│   │   └── previewer.tsx       # 预览组件
│   ├── pages/
│   │   └── session.tsx         # 集成预览组件的主页面
│   └── ...                     # 其他原始文件
├── package.json                # 项目配置
└── README.md                   # 本文档
```

## 安装和启动

### 前置要求
- Node.js 18+ 
- Bun 运行时（推荐）
- OpenCode 后端服务运行在 `http://localhost:4096`

### 启动步骤

1. **启动后端服务**
```powershell
cd packages/opencode
bun run --conditions=browser ./src/index.ts serve --port 4096
```

2. **启动 WebApp Previewer 前端**
```powershell
cd webapp-previewer
bun run dev
```

前端默认启动在 `http://localhost:5173`（Vite 默认端口）

## 使用方法

### 自动预览
1. 确保自动预览功能已启用（默认启用）
2. 让 OpenCode 生成一个 HTML 文件
3. 预览面板会自动打开并显示生成的 Web 应用

### 手动控制
1. 点击预览面板右上角的按钮可以：
   - 切换设备模式（Desktop/Tablet/Mobile）
   - 开关自动预览功能
   - 在新标签页中打开预览
   - 关闭预览面板

2. 重新打开预览面板：
   - 通过命令面板（Ctrl/Cmd+K）
   - 或点击工具栏的预览按钮（待实现）

## 技术实现

### 核心组件

#### WebAppPreviewer
主预览组件，包含：
- 工具栏（设备切换、自动预览开关等）
- 预览区域（iframe 显示）
- 空状态提示

#### useWebAppPreview Hook
状态管理 Hook，提供：
- 预览状态管理
- 文件检测逻辑
- URL 生成
- 设备模式切换

### 集成方式
预览组件被集成到 `session.tsx` 页面中，作为侧边面板显示，与现有的文件树面板和审查面板并列。

## 配置选项

### WebAppPreviewConfig
```typescript
interface WebAppPreviewConfig {
  backendUrl: string           // 后端服务 URL，默认 "http://localhost:4096"
  projectDirectory: string     // 项目目录路径
  autoPreview?: boolean        // 是否自动预览，默认 true
}
```

## 未来改进

- [ ] 实现完整的文件系统监听，自动检测文件变化
- [ ] 添加文件选择器，手动选择要预览的文件
- [ ] 支持多个预览面板同时打开
- [ ] 添加预览历史记录
- [ ] 支持预览刷新功能
- [ ] 优化移动端预览的交互体验
- [ ] 添加预览缩放功能
- [ ] 支持预览截图和分享

## 故障排除

### 预览无法加载
1. 确保后端服务正在运行
2. 检查后端服务端口是否为 4096
3. 确认项目目录中存在 HTML 文件

### 预览显示空白
1. 检查 HTML 文件路径是否正确
2. 查看浏览器控制台是否有错误信息
3. 尝试在新标签页中打开预览链接

### 设备模式切换无效
1. 刷新页面重试
2. 清除浏览器缓存

## 与官方版本的区别

| 特性 | 官方 packages/app | webapp-previewer |
|------|------------------|------------------|
| Web 应用预览 | ❌ | ✅ |
| 多设备预览 | ❌ | ✅ |
| 自动检测 HTML | ❌ | ✅ |
| 预览面板 | ❌ | ✅ |
| 核心功能 | ✅ | ✅ |

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个功能！

## 许可证

继承自 OpenCode 项目的 MIT 许可证。

---

**注意**：此项目是 OpenCode 的增强版本，专注于 Web 应用开发和预览体验。
