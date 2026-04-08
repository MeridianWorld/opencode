# OpenCode WebApp Previewer 启动脚本
# 此脚本会同时启动后端服务和前端界面

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  OpenCode WebApp Previewer" -ForegroundColor White
Write-Host "  Starting Services..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 启动后端服务
Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$rootDir\packages\opencode'
Write-Host '======================================' -ForegroundColor Cyan
Write-Host '  OpenCode Backend Server' -ForegroundColor White
Write-Host '======================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting server on http://localhost:4096...' -ForegroundColor Green
bun run --conditions=browser ./src/index.ts serve --port 4096
"@

# 等待后端启动
Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 启动前端界面
Write-Host "[2/2] Starting Frontend Interface..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$rootDir\webapp-previewer'
Write-Host '======================================' -ForegroundColor Cyan
Write-Host '  OpenCode WebApp Previewer' -ForegroundColor White
Write-Host '  Frontend Interface' -ForegroundColor White
Write-Host '======================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting frontend on http://localhost:5173...' -ForegroundColor Green
Write-Host ''
Write-Host 'Tips:' -ForegroundColor Yellow
Write-Host '  - Open http://localhost:5173 in your browser' -ForegroundColor Gray
Write-Host '  - Generate HTML files to see auto-preview' -ForegroundColor Gray
Write-Host '  - Use device mode buttons to test responsiveness' -ForegroundColor Gray
Write-Host ''
bun run dev
"@

# 显示完成信息
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Services Started Successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:4096" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
