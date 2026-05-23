#!/usr/bin/env bash
# SmartMediaDisk - 查看服务状态
# 用法: ./bin/status.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "========================================="
echo " SmartMediaDisk - 服务状态"
echo "========================================="
echo ""

# Docker 模式
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    echo "--- Docker 容器 ---"
    docker compose ps 2>/dev/null || echo "  开发环境未启动"
    echo ""

    echo "--- 容器资源使用 ---"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        $(docker compose ps -q 2>/dev/null) 2>/dev/null || true
else
    echo "Docker 服务未运行"
fi

echo ""
echo "--- 端口监听 ---"
lsof -iTCP:8000 -sTCP:LISTEN -P -n 2>/dev/null | grep -v "^COMMAND" | awk '{print $1, $9}' || echo "  端口 8000 (Django): 无进程"
lsof -iTCP:8080 -sTCP:LISTEN -P -n 2>/dev/null | grep -v "^COMMAND" | awk '{print $1, $9}' || echo "  端口 8080 (Nginx): 无进程"

echo ""
echo "--- 磁盘使用 ---"
DATA_DIR="$(pwd)/data"
if [ -d "$DATA_DIR" ]; then
    echo "数据目录 ($DATA_DIR):"
    du -sh "$DATA_DIR" 2>/dev/null || echo "  无法获取"
fi