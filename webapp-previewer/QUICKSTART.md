# 快速启动指南

## 启动 OpenCode WebApp Previewer

### 方法一：使用两个终端窗口（推荐）

#### 终端 1 - 启动后端服务
```powershell
cd d:\github_repo\opencode\packages\opencode
bun run --conditions=browser ./src/index.ts serve --port 4096
```

等待后端启动完成，显示类似信息：
```
Server running on http://localhost:4096
```

#### 终端 2 - 启动前端界面
```powershell
cd d:\github_repo\opencode\webapp-previewer
bun run dev
```

等待前端启动完成，显示类似信息：
```
VITE ready in 500ms
➜  Local:   http://localhost:5173/
```

### 方法二：使用脚本一键启动

创建一个启动脚本 `start-preview.ps1`：

```powershell
# start-preview.ps1

Write-Host "Starting OpenCode WebApp Previewer..." -ForegroundColor Green

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PSScriptRoot\packages\opencode'
Write-Host 'Starting backend server...' -ForegroundColor Cyan
bun run --conditions=browser ./src/index.ts serve --port 4096
"@

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PSScriptRoot\webapp-previewer'
Write-Host 'Starting frontend...' -ForegroundColor Cyan
bun run dev
"@

Write-Host "Both servers started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:4096" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
```

运行脚本：
```powershell
.\start-preview.ps1
```

## 使用 Web 应用预览功能

### 1. 访问应用
打开浏览器访问：`http://localhost:5173`

### 2. 创建项目
- 点击 "New Session" 创建新会话
- 选择项目目录

### 3. 生成 Web 应用
让 OpenCode 生成一个 HTML 文件，例如：
```
创建一个简单的 HTML 页面，包含标题和段落
```

### 4. 查看预览
- 预览面板会自动打开
- 在预览面板中可以看到生成的 HTML 页面
- 使用顶部工具栏切换设备模式

### 5. 手动控制预览
- 点击 "Auto" 按钮开关自动预览
- 点击设备按钮切换 Desktop/Tablet/Mobile 模式
- 点击外部链接按钮在新标签页打开
- 点击 X 按钮关闭预览面板

## 测试示例

### 示例 1：创建个人主页
```
创建一个个人主页 HTML 文件，包含：
- 导航栏
- 个人简介部分
- 项目展示部分
- 联系方式部分
使用现代化的 CSS 样式
```

### 示例 2：创建待办事项应用
```
创建一个交互式待办事项应用：
- HTML 结构
- CSS 样式
- JavaScript 交互功能
包括添加、删除、标记完成等功能
```

### 示例 3：创建登录页面
```
创建一个产品登录页面：
- 响应式设计
- 英雄区域
- 功能介绍
- 用户评价
- 页脚
```

## 常见问题

### Q: 预览面板没有自动打开？
A: 检查以下几点：
1. 确认自动预览功能已启用（点击 "Auto" 按钮）
2. 确认 HTML 文件已成功生成
3. 手动打开预览：稍后可以通过命令面板打开

### Q: 预览显示空白页面？
A: 可能原因：
1. HTML 文件路径不正确
2. 后端服务未正常启动
3. 浏览器控制台有错误信息

### Q: 如何查看多个 HTML 文件？
A: 当前版本会自动检测第一个 HTML 文件。后续版本将添加文件选择器。

### Q: 设备模式不准确？
A: 设备模式提供的是近似宽度，实际显示可能因 CSS 而异。

## 开发调试

### 查看日志
后端日志会显示在终端 1，前端日志在浏览器控制台。

### 热重载
前端支持热重载，修改代码后会自动刷新。

### 调试模式
在浏览器中按 F12 打开开发者工具，可以：
- 查看控制台日志
- 检查网络请求
- 调试 JavaScript 代码

## 性能优化建议

1. **关闭不需要的预览**：预览多个文件时，及时关闭不用的预览面板
2. **使用生产模式**：部署时使用 `bun run build` 构建生产版本
3. **限制文件大小**：避免预览过大的 HTML 文件

## 下一步

- 尝试生成更复杂的 Web 应用
- 测试不同设备模式下的显示效果
- 探索 OpenCode 的其他功能

---

**提示**：如果遇到任何问题，请查看 README.md 中的故障排除部分。
