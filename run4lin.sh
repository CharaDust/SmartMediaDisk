#!/usr/bin/env bash
# SmartMediaDisk 项目运行与开发统一入口
# 用法: ./run4lin.sh <命令>
#   容器: up | down | restart | logs | ps | prod
#   开发: dev | migrate | collectstatic

set -e
cd "$(dirname "$0")"

NAME=smart-media-disk
DJANGO_DIR=src/django
VERSION=$(git describe --tags 2>/dev/null || echo "dev")

# 默认环境变量
export PYTHONUNBUFFERED=1

cmd_help() {
  echo "用法: $0 <命令> [选项]"
  echo ""
  echo "  容器（Docker Compose - 开发环境）"
  echo "    up       启动开发环境容器"
  echo "    down     停止并移除开发环境容器"
  echo "    restart  重启开发环境"
  echo "    logs     查看日志（-f 跟随输出）"
  echo "    ps       查看状态"
  echo ""
  echo "  容器（Docker Compose - 生产环境）"
  echo "    prod     使用 docker-compose.yml.prod 启动生产环境"
  echo ""
  echo "  本地开发（直接在宿主机运行）"
  echo "    dev      运行 Django 开发服务器 (python manage.py runserver)"
  echo "    migrate  执行数据库迁移 (makemigrations & migrate)"
  echo "    shell    进入 Django shell"
  echo ""
  echo "  其他"
  echo "    help     显示本帮助"
}

# ---------- 容器 (Dev) ----------
cmd_up() {
  docker compose up -d --build
  echo "开发环境已启动"
}

cmd_down() {
  docker compose down ${2:-}
  echo "容器已停止"
}

cmd_restart() {
  docker compose restart
  echo "容器已重启"
}

cmd_logs() {
  docker compose logs -f "${@:2}"
}

cmd_ps() {
  docker compose ps
}

# ---------- 容器 (Prod) ----------
cmd_prod() {
  docker compose -f docker-compose.yml.prod up -d --build
  echo "生产环境已启动"
}

# ---------- 本地开发 ----------
cmd_dev() {
  cd "$DJANGO_DIR"
  python manage.py runserver 0.0.0.0:8000
}

cmd_migrate() {
  cd "$DJANGO_DIR"
  python manage.py makemigrations
  python manage.py migrate
  echo "数据库迁移完成"
}

cmd_shell() {
  cd "$DJANGO_DIR"
  python manage.py shell
}

# ---------- 分发 ----------
case "${1:-}" in
  up)       cmd_up ;;
  down)     cmd_down "$@" ;;
  restart)  cmd_restart ;;
  logs)     cmd_logs "$@" ;;
  ps)       cmd_ps ;;
  prod)     cmd_prod ;;
  dev)      cmd_dev ;;
  migrate)  cmd_migrate ;;
  shell)    cmd_shell ;;
  help|--help|-h) cmd_help ;;
  *)        cmd_help; exit 1 ;;
esac