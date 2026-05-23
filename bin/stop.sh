#!/usr/bin/env bash
# SmartMediaDisk - 停止服务
# 用法: ./bin/stop.sh [--remove] [--prod]

set -euo pipefail
cd "$(dirname "$0")/.."

REMOVE=false
PROD=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --remove) REMOVE=true ;;
        --prod)   PROD=true ;;
        *)        echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

if [ "$PROD" = true ]; then
    COMPOSE_FILE="docker-compose.yml.prod"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo ">>> 停止容器..."
if [ "$REMOVE" = true ]; then
    docker compose -f "$COMPOSE_FILE" down --volumes
    echo "容器及数据卷已移除"
else
    docker compose -f "$COMPOSE_FILE" down
    echo "容器已停止"
fi

echo ""
echo "如需重新启动: ./bin/start.sh"