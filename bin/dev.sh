#!/usr/bin/env bash
# SmartMediaDisk - macOS 本地开发模式 (无需 Docker)
# 用法: ./bin/dev.sh [--migrate] [--host=0.0.0.0] [--port=8000]

set -euo pipefail
cd "$(dirname "$0")/.."

HOST="0.0.0.0"
PORT="8000"
DO_MIGRATE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --migrate)     DO_MIGRATE=true ;;
        --host=*)      HOST="${1#*=}" ;;
        --port=*)      PORT="${1#*=}" ;;
        *)             echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

# ---------- Python 检查 ----------
if ! command -v python3 &>/dev/null; then
    echo "错误: 未检测到 python3"
    echo "请通过 Homebrew 安装: brew install python@3.11"
    exit 1
fi

# ---------- 环境变量 (macOS 本地路径) ----------
export PYTHONUNBUFFERED=1
export DJANGO_SETTINGS_MODULE=project.settings
export SMARTMEDIADISK_SQLITE_PATH="${SMARTMEDIADISK_SQLITE_PATH:-$PWD/data/db.sqlite3}"
export SMARTMEDIADISK_STORAGE_PATH="${SMARTMEDIADISK_STORAGE_PATH:-$PWD/data/storage}"
export SMARTMEDIADISK_UPLOAD_TEMP_PATH="${SMARTMEDIADISK_UPLOAD_TEMP_PATH:-$PWD/data/upload-tmp}"
export SMARTMEDIADISK_PREVIEW_CACHE_PATH="${SMARTMEDIADISK_PREVIEW_CACHE_PATH:-$PWD/data/preview-cache}"

mkdir -p "$PWD/data/storage" "$PWD/data/upload-tmp" "$PWD/data/preview-cache"

echo "========================================="
echo " SmartMediaDisk - macOS 本地开发模式"
echo "========================================="
echo ""
echo " 数据目录: $PWD/data"
echo " 数据库:   $(dirname "$SMARTMEDIADISK_SQLITE_PATH")"
echo ""

cd src/django

# 数据库迁移
if [ "$DO_MIGRATE" = true ]; then
    echo ">>> 执行数据库迁移..."
    python3 manage.py makemigrations
    python3 manage.py migrate --noinput
    python3 manage.py ensure_default_user 2>/dev/null || true
    echo ""
fi

echo ">>> 启动 Django 开发服务器 (${HOST}:${PORT})..."
echo "    注意: 本地开发模式下，静态文件由 Django 直接提供"
echo "    如需 Nginx 反向代理和 SSI，请使用 Docker 模式: ./bin/start.sh"
echo ""

python3 manage.py runserver "${HOST}:${PORT}"