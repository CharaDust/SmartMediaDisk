#!/usr/bin/env bash
# SmartMediaDisk - 数据库迁移
# 用法: ./bin/migrate.sh [--docker]

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
    echo ">>> 在 Docker 容器中执行数据库迁移..."
    CONTAINER=$(docker compose ps -q django-dev 2>/dev/null)
    if [ -z "$CONTAINER" ]; then
        echo "错误: django-dev 容器未运行，请先执行 ./bin/start.sh"
        exit 1
    fi
    docker compose exec django-dev python manage.py makemigrations
    docker compose exec django-dev python manage.py migrate --noinput
    docker compose exec django-dev python manage.py ensure_default_user 2>/dev/null || true
else
    echo ">>> 在本地环境执行数据库迁移..."
    if ! command -v python3 &>/dev/null; then
        echo "错误: 未检测到 python3"
        exit 1
    fi
    export SMARTMEDIADISK_SQLITE_PATH="${SMARTMEDIADISK_SQLITE_PATH:-$PWD/data/db.sqlite3}"
    export SMARTMEDIADISK_STORAGE_PATH="${SMARTMEDIADISK_STORAGE_PATH:-$PWD/data/storage}"
    export SMARTMEDIADISK_UPLOAD_TEMP_PATH="${SMARTMEDIADISK_UPLOAD_TEMP_PATH:-$PWD/data/upload-tmp}"
    export SMARTMEDIADISK_PREVIEW_CACHE_PATH="${SMARTMEDIADISK_PREVIEW_CACHE_PATH:-$PWD/data/preview-cache}"
    mkdir -p "$PWD/data/storage" "$PWD/data/upload-tmp" "$PWD/data/preview-cache"

    cd src/django
    python3 manage.py makemigrations
    python3 manage.py migrate --noinput
    python3 manage.py ensure_default_user 2>/dev/null || true
fi

echo ""
echo "数据库迁移完成"