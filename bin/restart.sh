#!/usr/bin/env bash
# SmartMediaDisk - 重启服务
# 用法: ./bin/restart.sh [--build] [--prod]

set -euo pipefail
cd "$(dirname "$0")/.."

BUILD_FLAG=""
PROD=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --build) BUILD_FLAG="--build" ;;
        --prod)  PROD=true ;;
        *)       echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

if [ "$PROD" = true ]; then
    COMPOSE_FILE="docker-compose.yml.prod"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo ">>> 重启容器..."
docker compose -f "$COMPOSE_FILE" restart $BUILD_FLAG
echo "容器已重启"