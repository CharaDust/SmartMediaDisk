#!/usr/bin/env bash
# SmartMediaDisk - 清理脚本
# 用法: ./bin/clean.sh [--all] [--containers] [--volumes] [--images]

set -euo pipefail
cd "$(dirname "$0")/.."

CLEAN_CONTAINERS=false
CLEAN_VOLUMES=false
CLEAN_IMAGES=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --all)        CLEAN_CONTAINERS=true; CLEAN_VOLUMES=true; CLEAN_IMAGES=true ;;
        --containers) CLEAN_CONTAINERS=true ;;
        --volumes)    CLEAN_VOLUMES=true ;;
        --images)     CLEAN_IMAGES=true ;;
        *)            echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

# 默认只清理容器
if ! $CLEAN_CONTAINERS && ! $CLEAN_VOLUMES && ! $CLEAN_IMAGES; then
    CLEAN_CONTAINERS=true
fi

if [ "$CLEAN_CONTAINERS" = true ]; then
    echo ">>> 停止并移除开发环境容器..."
    docker compose down 2>/dev/null || true
    docker compose -f docker-compose.yml.prod down 2>/dev/null || true
    echo "容器已清理"
fi

if [ "$CLEAN_VOLUMES" = true ]; then
    echo ">>> 移除 Docker 卷..."
    docker compose down --volumes 2>/dev/null || true
    docker compose -f docker-compose.yml.prod down --volumes 2>/dev/null || true
    docker volume prune -f 2>/dev/null || true
    echo "卷已清理"
fi

if [ "$CLEAN_IMAGES" = true ]; then
    echo ">>> 移除项目 Docker 镜像..."
    docker rmi smartmediadisk-django-dev:latest 2>/dev/null || true
    docker rmi smartmediadisk-nginx-dev:latest 2>/dev/null || true
    echo "镜像已清理"
fi

echo ""
echo "清理完成"