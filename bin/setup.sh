#!/usr/bin/env bash
# SmartMediaDisk - macOS 环境初始化脚本
# 用法: ./bin/setup.sh [--skip-docker] [--skip-python]

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ROOT="$(pwd)"
DATA_DIR="$PROJECT_ROOT/data"
PYTHON_CMD="python3"

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

SKIP_DOCKER=false
SKIP_PYTHON=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-docker) SKIP_DOCKER=true ;;
        --skip-python) SKIP_PYTHON=true ;;
        *) echo "未知参数: $1"; exit 1 ;;
    esac
    shift
done

echo "========================================="
echo " SmartMediaDisk - macOS 环境初始化"
echo "========================================="
echo ""

# ---------- 1. 检测 Docker ----------
if [ "$SKIP_DOCKER" = false ]; then
    echo "[1/5] 检测 Docker 环境..."
    if command -v docker &>/dev/null; then
        pass "Docker CLI 已安装 ($(docker --version))"
        if docker info &>/dev/null 2>&1; then
            pass "Docker 服务运行中"
        else
            warn "Docker 服务未运行，请启动 Docker Desktop"
        fi
    else
        warn "未检测到 Docker CLI，请安装 Docker Desktop: https://docs.docker.com/desktop/mac-install/"
    fi

    if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
        pass "Docker Compose 已可用 ($(docker compose version))"
    else
        warn "Docker Compose 不可用，请升级 Docker Desktop"
    fi
fi

# ---------- 2. 检测 Python ----------
if [ "$SKIP_PYTHON" = false ]; then
    echo ""
    echo "[2/5] 检测 Python 环境..."
    if command -v python3 &>/dev/null; then
        PY_VER=$(python3 --version 2>&1 | awk '{print $2}')
        PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
        PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
        if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 9 ]; then
            pass "Python $PY_VER (>= 3.9)"
        else
            fail "Python 版本过低 ($PY_VER), 需要 3.9+"
        fi
    else
        warn "未检测到 python3，请通过 Homebrew 安装: brew install python@3.11"
    fi

    if command -v python3 &>/dev/null; then
        if python3 -c "import django" 2>/dev/null; then
            pass "Django 已安装 ($(python3 -c 'import django; print(django.get_version())'))"
        else
            warn "Django 未安装，请执行: pip3 install -r requirements.txt"
        fi
    fi
fi

# ---------- 3. 创建数据目录 ----------
echo ""
echo "[3/5] 创建数据目录..."
mkdir -p "$DATA_DIR/storage"
mkdir -p "$DATA_DIR/upload-tmp"
mkdir -p "$DATA_DIR/preview-cache"
mkdir -p "$DATA_DIR/logs"
pass "数据目录已就绪: $DATA_DIR"

# ---------- 4. 安装 Python 依赖 ----------
if [ "$SKIP_PYTHON" = false ] && command -v python3 &>/dev/null; then
    echo ""
    echo "[4/5] 安装 Python 依赖..."
    if pip3 install -r "$PROJECT_ROOT/requirements.txt" --quiet 2>&1; then
        pass "依赖安装完成"
    else
        warn "依赖安装失败，请手动执行: pip3 install -r requirements.txt"
    fi
fi

# ---------- 5. Docker Compose 状态 ----------
if [ "$SKIP_DOCKER" = false ] && command -v docker &>/dev/null; then
    echo ""
    echo "[5/5] 检查 Docker Compose 配置..."
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        pass "docker-compose.yml 已就绪"
    else
        fail "docker-compose.yml 不存在"
    fi
fi

echo ""
echo "========================================="
echo " 环境初始化完成"
echo ""
echo " 下一步:"
echo "   Docker 模式: ./bin/start.sh"
echo "   本地开发模式: ./bin/dev.sh"
echo "========================================="