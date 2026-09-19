#!/bin/bash
cd "$(dirname "$0")"
export LANG=zh_CN.UTF-8

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js，无法启动。"
  echo "请先安装：https://nodejs.org"
  read -r -p "按回车键退出…"
  exit 1
fi

if [ ! -f "node_modules/remotion/package.json" ]; then
  echo "首次启动，正在安装运行组件，预计 1–3 分钟…"
  npm install || {
    echo "安装失败，请检查网络后重试。"
    read -r -p "按回车键退出…"
    exit 1
  }
fi

echo "正在启动，网页会自动打开…"
echo "此窗口用于运行工具，使用期间请勿关闭。"
node server.js

echo "工具已停止。"
read -r -p "按回车键退出…"
