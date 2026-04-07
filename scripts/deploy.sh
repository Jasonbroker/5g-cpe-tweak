#!/bin/bash
# CPE Ctrl Deploy Script
# Deploys backend and frontend to device via ADB

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

TARGET_PATH="/home/root"
RESTART_SERVICE=true

# 解析命令行参数
for arg in "$@"; do
    case $arg in
        --no-restart)
            RESTART_SERVICE=false
            ;;
        --target=*)
            TARGET_PATH="${arg#*=}"
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --target=PATH    指定目标路径 (默认: /home/root)"
            echo "  --no-restart     不重启服务"
            echo "  --help, -h       显示帮助"
            exit 0
            ;;
    esac
done

BACKEND_BIN="$PROJECT_DIR/backend/target/aarch64-unknown-linux-musl/release/cpe-ctrl"
FRONTEND_DIR="$PROJECT_DIR/www"

echo "🚀 Deploying to ${TARGET_PATH}"

# 检查 ADB
if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb not found"
    echo "Please install Android SDK Platform Tools"
    exit 1
fi

# 检查 ADB 连接
if ! adb devices | grep -q "device$"; then
    echo "❌ Error: No ADB device connected"
    exit 1
fi

# 检查后端文件
if [ ! -f "$BACKEND_BIN" ]; then
    echo "❌ Error: Backend binary not found at $BACKEND_BIN"
    echo "Please run ./scripts/build.sh first"
    exit 1
fi

# 检查前端文件
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Error: Frontend dist not found at $FRONTEND_DIR"
    echo "Please run ./scripts/build.sh first"
    exit 1
fi

# 停止服务
if [ "$RESTART_SERVICE" = true ]; then
    echo "⏹️  Stopping existing service..."
    adb shell "killall cpe-ctrl 2>/dev/null || true"
fi

# 部署后端
echo "📦 Deploying backend..."
adb push "$BACKEND_BIN" "${TARGET_PATH}/cpe-ctrl"
adb shell "chmod +x ${TARGET_PATH}/cpe-ctrl"

# 部署前端
echo "📦 Deploying frontend..."
adb shell "rm -rf ${TARGET_PATH}/www && mkdir -p ${TARGET_PATH}/www"
adb push "$FRONTEND_DIR/." "${TARGET_PATH}/www/"

echo ""
echo "✅ Deploy complete!"
echo ""
echo "To run:"
echo "  adb shell"
echo "  cd ${TARGET_PATH} && ./cpe-ctrl --port 80"
