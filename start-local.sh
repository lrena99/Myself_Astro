#!/bin/bash
# ============================================================
# start-local.sh — 一键启动本地博客服务（幂等）：
#   1. Astro dev server（容器内 0.0.0.0:4321，热更新）
#   2. auto-sync.sh 自动同步到 GitHub
# 用法：bash /opt/data/workspace/blog/start-local.sh
# ============================================================
set -u
export PATH="/opt/data/home/.npm-global/bin:$PATH"
export HOME="/opt/data/home"

BLOG="/opt/data/workspace/blog"
cd "$BLOG" || exit 1

# 1. dev server
if ! curl -s -o /dev/null http://127.0.0.1:4321/ 2>/dev/null; then
    nohup pnpm dev --host > "$BLOG/dev-server.log" 2>&1 &
    echo "dev server starting (log: $BLOG/dev-server.log)"
else
    echo "dev server already running on :4321"
fi

# 2. auto-sync
if ! pgrep -f "^bash $BLOG/auto-sync.sh" > /dev/null 2>&1; then
    nohup bash "$BLOG/auto-sync.sh" > /dev/null 2>&1 &
    echo "auto-sync started (log: $BLOG/auto-sync.log)"
else
    echo "auto-sync already running"
fi

sleep 5
echo "---"
echo "本地预览: http://localhost:4321/Myself_Astro/"
echo "局域网访问: http://<宿主机IP>:4321/Myself_Astro/  (需宿主机 socat 转发)"
