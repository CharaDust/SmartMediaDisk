#!/usr/bin/env bash
# SmartMediaDisk - 启动服务 (Docker Compose 开发环境)
# 用法: ./bin/start.sh [--build] [--prod]

set -euo pipefail
cd "$(dirname "$0")/.."

PROD=false
BUILD_FLAG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --build)  BUILD_FLAG="--build" ;;
        --prod)   PROD=true ;;
        *)        echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

# ---------- 环境检查 ----------
if ! command -v docker &>/dev/null; then
    echo "错误: 未检测到 docker CLI，请安装 Docker Desktop"
    echo "     https://docs.docker.com/desktop/mac-install/"
    exit 1
fi

if ! docker info &>/dev/null 2>&1; then
    echo "错误: Docker 服务未运行，请先启动 Docker Desktop"
    exit 1
fi

# ---------- 选择 compose 配置 ----------
if [ "$PROD" = true ]; then
    COMPOSE_FILE="docker-compose.yml.prod"
    echo ">>> 启动生产环境 (docker-compose.yml.prod)..."
else
    COMPOSE_FILE="docker-compose.yml"
    echo ">>> 启动开发环境 (docker-compose.yml)..."
fi

docker compose -f "$COMPOSE_FILE" up -d $BUILD_FLAG

echo ""
echo "========================================="
echo " SmartMediaDisk 已启动"
echo ""
echo " 访问地址:  http://localhost:8080"
echo " API:        http://localhost:8080/api/"
echo " Django:     http://localhost:8000"
echo ""
echo " 默认账号:"
echo "   root / 123456  (管理员)"
echo "   user / 123456  (普通用户)"
echo ""
echo " 查看日志:  ./bin/logs.sh"
echo " 停止服务:  ./bin/stop.sh"
echo "========================================="