#!/usr/bin/env bash
# SmartMediaDisk - 查看服务日志
# 用法: ./bin/logs.sh [-f] [service_name]

set -euo pipefail
cd "$(dirname "$0")/.."

FOLLOW=""
SERVICE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -f|--follow) FOLLOW="--follow" ;;
        -*)          echo "未知参数: $1"; exit 1 ;;
        *)           SERVICE="$1" ;;
    esac
    shift
done

if ! command -v docker &>/dev/null; then
    # 非 Docker 模式：读取本地日志
    LOG_DIR="$PWD/data/logs"
    if [ -d "$LOG_DIR" ]; then
        if [ "$FOLLOW" = "--follow" ]; then
            tail -f "$LOG_DIR"/*.log 2>/dev/null || echo "无日志文件"
        else
            tail -50 "$LOG_DIR"/*.log 2>/dev/null || echo "无日志文件"
        fi
    else
        echo "日志目录不存在: $LOG_DIR"
    fi
    exit 0
fi

if [ -n "$SERVICE" ]; then
    docker compose logs $FOLLOW "$SERVICE"
else
    docker compose logs $FOLLOW
fi