#!/usr/bin/env bash

# 若被 sh 调用，自动切到 bash 重新执行，避免 pipefail 等选项报错
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

REPO_URL="https://github.com/CharaDust/SmartMediaDisk.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 本脚本设计为独立放置：目标项目目录固定为脚本同级的 SmartMediaDisk
PROJECT_DIR="$SCRIPT_DIR/SmartMediaDisk"
OLD_DIR="$SCRIPT_DIR/SmartMediaDisk-old"

VOL_DIR="$SCRIPT_DIR/SmartMediaDisk-vol"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令: $1，请先安装后重试。"
    exit 1
  fi
}

need_cmd git
need_cmd curl
need_cmd unzip

echo "正在从 GitHub 获取分支列表..."
mapfile -t BRANCHES < <(git ls-remote --heads "$REPO_URL" | awk '{print $2}' | sed 's#refs/heads/##' | sort)

if (( ${#BRANCHES[@]} == 0 )); then
  echo "未获取到任何分支，请检查网络或仓库地址。"
  exit 1
fi

echo ""
echo "可选分支："
for i in "${!BRANCHES[@]}"; do
  printf "  %2d) %s\n" "$((i + 1))" "${BRANCHES[$i]}"
done

echo ""
read -r -p "请输入要发布的分支编号（默认 1）: " BRANCH_INDEX
BRANCH_INDEX="${BRANCH_INDEX:-1}"

if ! [[ "$BRANCH_INDEX" =~ ^[0-9]+$ ]]; then
  echo "输入无效：必须是数字编号。"
  exit 1
fi

if (( BRANCH_INDEX < 1 || BRANCH_INDEX > ${#BRANCHES[@]} )); then
  echo "输入无效：编号超出范围。"
  exit 1
fi

BRANCH="${BRANCHES[$((BRANCH_INDEX - 1))]}"
SAFE_BRANCH="$(echo "$BRANCH" | sed 's#[^A-Za-z0-9._-]#_#g')"
ZIP_PATH="$SCRIPT_DIR/SmartMediaDisk-${SAFE_BRANCH}.zip"
DOWNLOAD_URL="https://github.com/CharaDust/SmartMediaDisk/archive/refs/heads/${BRANCH}.zip"

echo ""
echo "已选择分支: $BRANCH"
echo "正在下载压缩包到: $ZIP_PATH"
curl -fL "$DOWNLOAD_URL" -o "$ZIP_PATH"

echo ""
echo "正在备份旧项目数据到: $VOL_DIR"
mkdir -p "$VOL_DIR"
rm -rf "$VOL_DIR/data" "$VOL_DIR/docker-compose.yml" "$VOL_DIR/run4lin.sh"

if [[ -d "$PROJECT_DIR" ]]; then
  if [[ -f "$PROJECT_DIR/run4lin.sh" ]]; then
    echo "检测到旧项目，先执行 run4lin.sh down 关闭服务..."
    bash "$PROJECT_DIR/run4lin.sh" down
  fi
  [[ -d "$PROJECT_DIR/data" ]] && cp -a "$PROJECT_DIR/data" "$VOL_DIR/"
  [[ -f "$PROJECT_DIR/docker-compose.yml" ]] && cp -a "$PROJECT_DIR/docker-compose.yml" "$VOL_DIR/"
  [[ -f "$PROJECT_DIR/run4lin.sh" ]] && cp -a "$PROJECT_DIR/run4lin.sh" "$VOL_DIR/"

  if [[ -e "$OLD_DIR" ]]; then
    BACKUP_OLD_DIR="${OLD_DIR}-$(date +%Y%m%d%H%M%S)"
    echo "检测到已存在 $OLD_DIR，先重命名为: $BACKUP_OLD_DIR"
    mv "$OLD_DIR" "$BACKUP_OLD_DIR"
  fi
  echo "正在将旧项目目录重命名为: $OLD_DIR"
  mv "$PROJECT_DIR" "$OLD_DIR"
else
  echo "未检测到旧项目目录，准备新建: $PROJECT_DIR"
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "正在解压新版本..."
unzip -q "$ZIP_PATH" -d "$TMP_DIR"

shopt -s nullglob
extracted_items=("$TMP_DIR"/*)
shopt -u nullglob
if (( ${#extracted_items[@]} != 1 )); then
  echo "解压结果异常，无法识别根目录。"
  exit 1
fi

echo "正在部署新项目目录: $PROJECT_DIR"
mv "${extracted_items[0]}" "$PROJECT_DIR"

echo "正在恢复备份文件（冲突时覆盖）..."
shopt -s dotglob nullglob
vol_items=("$VOL_DIR"/*)
if (( ${#vol_items[@]} > 0 )); then
  cp -af "$VOL_DIR"/. "$PROJECT_DIR"/
fi
shopt -u dotglob nullglob

if [[ -f "$PROJECT_DIR/run4lin.sh" ]]; then
  echo "正在启动新项目服务..."
  bash "$PROJECT_DIR/run4lin.sh" up
fi

echo ""
echo "扫描可清理项..."
shopt -s nullglob
cleanup_candidates=()
cleanup_candidates+=("$SCRIPT_DIR/SmartMediaDisk-old")
cleanup_candidates+=("$SCRIPT_DIR"/SmartMediaDisk-old-*)
cleanup_candidates+=("$SCRIPT_DIR/SmartMediaDisk-vol")
cleanup_candidates+=("$SCRIPT_DIR"/SmartMediaDisk-*.zip)
shopt -u nullglob

final_cleanup_items=()
for item in "${cleanup_candidates[@]}"; do
  [[ -e "$item" ]] || continue
  skip=0
  for added in "${final_cleanup_items[@]:-}"; do
    if [[ "$item" == "$added" ]]; then
      skip=1
      break
    fi
  done
  (( skip == 0 )) && final_cleanup_items+=("$item")
done

if (( ${#final_cleanup_items[@]} > 0 )); then
  echo "发现以下可清理项："
  for i in "${!final_cleanup_items[@]}"; do
    printf "  %2d) %s\n" "$((i + 1))" "$(basename "${final_cleanup_items[$i]}")"
  done

  echo "  输入 all      : 全部清理"
  echo "  输入 none/回车: 暂不清理"
  echo "  输入编号      : 按编号清理（可逗号分隔，如 1,3,5）"
  read -r -p "请选择清理方式: " CLEAN_CHOICE
  CLEAN_CHOICE="${CLEAN_CHOICE:-none}"

  if [[ "$CLEAN_CHOICE" == "all" ]]; then
    for item in "${final_cleanup_items[@]}"; do
      rm -rf "$item"
    done
    echo "已全部清理。"
  elif [[ "$CLEAN_CHOICE" == "none" ]]; then
    echo "已保留全部可清理项。"
  else
    IFS=',' read -r -a CLEAN_INDEXES <<<"$CLEAN_CHOICE"
    for raw_idx in "${CLEAN_INDEXES[@]}"; do
      idx="$(echo "$raw_idx" | tr -d ' ')"
      if [[ "$idx" =~ ^[0-9]+$ ]] && (( idx >= 1 && idx <= ${#final_cleanup_items[@]} )); then
        rm -rf "${final_cleanup_items[$((idx - 1))]}"
      else
        echo "忽略无效编号: $raw_idx"
      fi
    done
    echo "已按选择清理。"
  fi
else
  echo "未发现可清理项。"
fi

echo ""
echo "发布完成。"
echo "项目目录: $PROJECT_DIR"
echo "备份目录: $VOL_DIR"
echo "压缩包路径: $ZIP_PATH"