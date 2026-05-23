#!/usr/bin/env bash
# SmartMediaDisk — macOS Docker 开发环境管理脚本
# 用法: ./bin/dev-mac.sh <命令> [选项]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ────────── 颜色 ──────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
pass()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; }

# ────────── Docker 前置检查 ──────────
docker_ok() {
    if ! command -v docker &>/dev/null; then
        fail "未检测到 docker CLI，请安装 Docker Desktop"
        echo "    https://docs.docker.com/desktop/mac-install/"
        return 1
    fi
    if ! docker info &>/dev/null 2>&1; then
        fail "Docker 服务未运行，请启动 Docker Desktop"
        return 1
    fi
    return 0
}

# ────────── 帮助 ──────────
cmd_help() {
    cat <<'HELP'
SmartMediaDisk — macOS Docker 开发环境

用法: ./bin/dev-mac.sh <命令> [选项]

命令:
  setup      检测环境并初始化（创建数据目录等）
  start      启动开发容器 [--build] [--prod]
  stop       停止容器 [--remove] [--prod]
  restart    重启容器 [--prod]
  logs       查看容器日志 [-f] [服务名]
  status     查看容器状态和端口占用
  migrate    在容器中执行数据库迁移
  shell      进入容器内 Django Shell
  clean      停止并移除容器 [--all|--volumes|--images]

示例:
  ./bin/dev-mac.sh setup
  ./bin/dev-mac.sh start
  ./bin/dev-mac.sh start --build
  ./bin/dev-mac.sh start --prod
  ./bin/dev-mac.sh logs -f
  ./bin/dev-mac.sh migrate
  ./bin/dev-mac.sh clean --all
HELP
}

# ────────── setup ──────────
cmd_setup() {
    echo "========================================="
    echo " SmartMediaDisk — macOS 环境初始化"
    echo "========================================="
    echo ""

    # Docker
    echo "[1/3] 检测 Docker..."
    if command -v docker &>/dev/null; then
        pass "Docker CLI: $(docker --version)"
        if docker info &>/dev/null 2>&1; then
            pass "Docker 服务运行中"
        else
            warn "Docker 服务未运行，请启动 Docker Desktop"
        fi
        if docker compose version &>/dev/null 2>&1; then
            pass "Docker Compose: $(docker compose version)"
        else
            warn "Docker Compose 不可用，请升级 Docker Desktop"
        fi
    else
        warn "Docker 未安装: https://docs.docker.com/desktop/mac-install/"
    fi

    # 数据目录
    echo ""
    echo "[2/3] 创建数据目录..."
    mkdir -p "$PROJECT_ROOT/data/storage"
    mkdir -p "$PROJECT_ROOT/data/upload-tmp"
    mkdir -p "$PROJECT_ROOT/data/preview-cache"
    mkdir -p "$PROJECT_ROOT/data/logs"
    pass "数据目录已就绪: $PROJECT_ROOT/data"

    # compose 文件
    echo ""
    echo "[3/3] 检查 Compose 配置..."
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        pass "docker-compose.yml 已就绪"
    else
        fail "docker-compose.yml 不存在"
    fi

    echo ""
    echo "环境初始化完成，执行 ./bin/dev-mac.sh start 启动服务"
}

# ────────── start ──────────
cmd_start() {
    docker_ok || exit 1

    local prod=false
    local build_flag=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --build) build_flag="--build" ;;
            --prod)  prod=true ;;
            *)       fail "未知参数: $1"; exit 1 ;;
        esac
        shift
    done

    local compose_file="$PROJECT_ROOT/docker-compose.yml"
    local label="开发环境"
    if [ "$prod" = true ]; then
        compose_file="$PROJECT_ROOT/docker-compose.yml.prod"
        label="生产环境"
    fi

    echo ">>> 启动 ${label}..."
    docker compose -f "$compose_file" up -d $build_flag

    echo ""
    echo "========================================="
    echo " SmartMediaDisk 已启动"
    echo ""
    echo " 前端:      http://localhost:8080"
    echo " Django:    http://localhost:8000"
    echo " API:       http://localhost:8080/api/"
    echo ""
    echo " 默认账号:  root / 123456    user / 123456"
    echo ""
    echo " 日志:      ./bin/dev-mac.sh logs -f"
    echo " 停止:      ./bin/dev-mac.sh stop"
    echo "========================================="
}

# ────────── stop ──────────
cmd_stop() {
    local remove=false
    local prod=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --remove) remove=true ;;
            --prod)   prod=true ;;
            *)        fail "未知参数: $1"; exit 1 ;;
        esac
        shift
    done

    local compose_file="$PROJECT_ROOT/docker-compose.yml"
    [ "$prod" = true ] && compose_file="$PROJECT_ROOT/docker-compose.yml.prod"

    echo ">>> 停止容器..."
    if [ "$remove" = true ]; then
        docker compose -f "$compose_file" down --volumes
        pass "容器及数据卷已移除"
    else
        docker compose -f "$compose_file" down
        pass "容器已停止"
    fi
}

# ────────── restart ──────────
cmd_restart() {
    local prod=false
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --prod) prod=true ;;
            *)      fail "未知参数: $1"; exit 1 ;;
        esac
        shift
    done

    local compose_file="$PROJECT_ROOT/docker-compose.yml"
    [ "$prod" = true ] && compose_file="$PROJECT_ROOT/docker-compose.yml.prod"

    echo ">>> 重启容器..."
    docker compose -f "$compose_file" restart
    pass "容器已重启"
}

# ────────── logs ──────────
cmd_logs() {
    local follow=""
    local service=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -f|--follow) follow="--follow" ;;
            *)           service="$1" ;;
        esac
        shift
    done

    if [ -n "$service" ]; then
        docker compose logs $follow "$service"
    else
        docker compose logs $follow
    fi
}

# ────────── status ──────────
cmd_status() {
    echo "========================================="
    echo " SmartMediaDisk — 服务状态"
    echo "========================================="
    echo ""

    echo "--- Docker 容器 ---"
    docker compose ps 2>/dev/null || echo "  开发环境未启动"
    echo ""

    if docker compose ps -q 2>/dev/null | grep -q .; then
        echo "--- 容器资源 ---"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
            $(docker compose ps -q) 2>/dev/null || true
    fi
    echo ""

    echo "--- 端口监听 ---"
    lsof -iTCP:8000 -sTCP:LISTEN -P -n 2>/dev/null | tail -n +2 | awk '{print "  " $1, $9}' || echo "  Django (8000): 无"
    lsof -iTCP:8080 -sTCP:LISTEN -P -n 2>/dev/null | tail -n +2 | awk '{print "  " $1, $9}' || echo "  Nginx  (8080): 无"

    echo ""
    echo "--- 数据目录 ---"
    du -sh "$PROJECT_ROOT/data" 2>/dev/null || echo "  无法获取"
}

# ────────── migrate ──────────
cmd_migrate() {
    docker_ok || exit 1

    local container
    container=$(docker compose ps -q django-dev 2>/dev/null)
    if [ -z "$container" ]; then
        fail "django-dev 容器未运行，请先执行 start"
        exit 1
    fi

    echo ">>> 执行数据库迁移..."
    docker compose exec django-dev python manage.py makemigrations
    docker compose exec django-dev python manage.py migrate --noinput
    docker compose exec django-dev python manage.py ensure_default_user 2>/dev/null || true
    pass "数据库迁移完成"
}

# ────────── shell ──────────
cmd_shell() {
    docker_ok || exit 1

    local container
    container=$(docker compose ps -q django-dev 2>/dev/null)
    if [ -z "$container" ]; then
        fail "django-dev 容器未运行，请先执行 start"
        exit 1
    fi

    docker compose exec django-dev python manage.py shell
}

# ────────── clean ──────────
cmd_clean() {
    local clean_containers=false
    local clean_volumes=false
    local clean_images=false

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --all)     clean_containers=true; clean_volumes=true; clean_images=true ;;
            --volumes) clean_volumes=true ;;
            --images)  clean_images=true ;;
            *)         fail "未知参数: $1"; exit 1 ;;
        esac
        shift
    done

    # 默认只清理容器
    if ! $clean_containers && ! $clean_volumes && ! $clean_images; then
        clean_containers=true
    fi

    if $clean_containers; then
        echo ">>> 停止并移除容器..."
        docker compose -f "$PROJECT_ROOT/docker-compose.yml" down 2>/dev/null || true
        docker compose -f "$PROJECT_ROOT/docker-compose.yml.prod" down 2>/dev/null || true
        pass "容器已清理"
    fi

    if $clean_volumes; then
        echo ">>> 移除 Docker 卷..."
        docker compose -f "$PROJECT_ROOT/docker-compose.yml" down --volumes 2>/dev/null || true
        docker compose -f "$PROJECT_ROOT/docker-compose.yml.prod" down --volumes 2>/dev/null || true
        docker volume prune -f 2>/dev/null || true
        pass "卷已清理"
    fi

    if $clean_images; then
        echo ">>> 移除项目镜像..."
        docker rmi smartmediadisk-django-dev:latest 2>/dev/null || true
        docker rmi smartmediadisk-nginx-dev:latest 2>/dev/null || true
        pass "镜像已清理"
    fi

    echo ""
    echo "清理完成"
}

# ────────── 分发 ──────────
case "${1:-}" in
    setup)    shift; cmd_setup "$@" ;;
    start)    shift; cmd_start "$@" ;;
    stop)     shift; cmd_stop "$@" ;;
    restart)  shift; cmd_restart "$@" ;;
    logs)     shift; cmd_logs "$@" ;;
    status)   shift; cmd_status "$@" ;;
    migrate)  shift; cmd_migrate "$@" ;;
    shell)    shift; cmd_shell "$@" ;;
    clean)    shift; cmd_clean "$@" ;;
    help|--help|-h) cmd_help ;;
    *)        cmd_help; exit 1 ;;
esac