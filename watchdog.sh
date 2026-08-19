#!/bin/bash
# ============================================================
# watchdog.sh — 检查本地博客服务，挂了自动拉起（幂等）
# 仅在实际执行了拉起动作时才输出（配合 no_agent cron 静默模式）
# ============================================================
set -u
export PATH="/opt/data/home/.npm-global/bin:/opt/data/bin:$PATH"
export HOME="/opt/data/home"

BLOG="/opt/data/workspace/blog"
ACTION=""

# dev server 检查
if ! pgrep -f "astro dev --host" > /dev/null 2>&1; then
    bash "$BLOG/start-local.sh" > /dev/null 2>&1
    ACTION="$ACTION dev-server"
fi

# auto-sync 检查
if ! pgrep -f "^bash $BLOG/auto-sync.sh" > /dev/null 2>&1; then
    bash "$BLOG/auto-sync.sh" > /dev/null 2>&1 &
    ACTION="$ACTION auto-sync"
fi

if [ -n "$ACTION" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] restarted:$ACTION"
fi
