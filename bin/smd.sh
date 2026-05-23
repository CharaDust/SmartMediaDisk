#!/usr/bin/env bash
# SmartMediaDisk - macOS 统一入口脚本
# 用法: ./bin/smd.sh <命令> [选项]
#
# 命令:
#   setup     初始化环境
#   start     启动服务 (Docker)
#   stop      停止服务
#   restart   重启服务
#   dev       本地开发模式 (无 Docker)
#   logs      查看日志
#   status    查看状态
#   migrate   数据库迁移
#   shell     进入 Django Shell
#   clean     清理容器/镜像/卷
#   help      显示帮助

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ---------- 帮助 ----------
cmd_help() {
    echo "SmartMediaDisk - macOS 管理脚本"
    echo ""
    echo "用法: $0 <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  setup      检测并初始化开发环境"
    echo "  start      启动服务 (Docker Compose 开发环境)"
    echo "  stop       停止服务"
    echo "  restart    重启服务"
    echo "  dev        本地开发模式 (无需 Docker，直接运行 Django)"
    echo "  logs       查看服务日志 (-f 跟随输出)"
    echo "  status     查看服务运行状态与端口占用"
    echo "  migrate    执行数据库迁移 (--docker 在容器中执行)"
    echo "  shell      进入 Django Shell (--docker 进入容器)"
    echo "  clean      清理容器和镜像 (--all 清理全部)"
    echo "  help       显示本帮助"
    echo ""
    echo "示例:"
    echo "  $0 start              # 启动开发环境"
    echo "  $0 start --build      # 启动并重新构建镜像"
    echo "  $0 start --prod       # 启动生产环境"
    echo "  $0 dev --migrate      # 本地开发模式 + 数据库迁移"
    echo "  $0 logs -f            # 实时查看日志"
    echo "  $0 clean --all        # 清理所有容器、卷和镜像"
}

# ---------- 分发到独立脚本 ----------
case "${1:-}" in
    setup)
        exec "$SCRIPT_DIR/setup.sh" "${@:2}"
        ;;
    start)
        exec "$SCRIPT_DIR/start.sh" "${@:2}"
        ;;
    stop)
        exec "$SCRIPT_DIR/stop.sh" "${@:2}"
        ;;
    restart)
        exec "$SCRIPT_DIR/restart.sh" "${@:2}"
        ;;
    dev)
        exec "$SCRIPT_DIR/dev.sh" "${@:2}"
        ;;
    logs)
        exec "$SCRIPT_DIR/logs.sh" "${@:2}"
        ;;
    status)
        exec "$SCRIPT_DIR/status.sh" "${@:2}"
        ;;
    migrate)
        exec "$SCRIPT_DIR/migrate.sh" "${@:2}"
        ;;
    shell)
        exec "$SCRIPT_DIR/shell.sh" "${@:2}"
        ;;
    clean)
        exec "$SCRIPT_DIR/clean.sh" "${@:2}"
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        cmd_help
        exit 1
        ;;
esac