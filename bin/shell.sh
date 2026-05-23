#!/usr/bin/env bash
# SmartMediaDisk - 进入 Django Shell
# 用法: ./bin/shell.sh [--docker]

set -euo pipefail
cd "$(dirname "$0")/.."

USE_DOCKER=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --docker) USE_DOCKER=true ;;
        *)        echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

if [ "$USE_DOCKER" = true ]; then
    CONTAINER=$(docker compose ps -q django-dev 2>/dev/null)
    if [ -z "$CONTAINER" ]; then
        echo "错误: django-dev 容器未运行，请先执行 ./bin/start.sh"
        exit 1
    fi
    docker compose exec django-dev python manage.py shell
else
    if ! command -v python3 &>/dev/null; then
        echo "错误: 未检测到 python3"
        exit 1
    fi
    export SMARTMEDIADISK_SQLITE_PATH="${SMARTMEDIADISK_SQLITE_PATH:-$PWD/data/db.sqlite3}"
    cd src/django
    python3 manage.py shell
fi