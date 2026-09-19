@echo off
chcp 65001 >nul
title 星露谷任务视频编辑器
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js，无法启动。
  echo 请先安装 Node.js，再重新双击本文件。
  pause
  exit /b 1
)

if not exist "node_modules\remotion\package.json" (
  echo 首次启动，正在安装运行组件，预计 1-3 分钟...
  call npm install
  if errorlevel 1 (
    echo 安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo 正在启动，网页会自动打开...
echo 此窗口用于运行工具，使用期间请勿关闭。
node server.js

echo 工具已停止。
pause
