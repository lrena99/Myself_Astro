#!/bin/bash
# ============================================================
# start-local.sh — 一键启动本地博客服务（幂等）：
#   1. Astro dev server（容器内 0.0.0.0:4321，热更新）
#   2. auto-sync.sh 自动同步到 GitHub
# 用法：bash /opt/data/workspace/blog/start-local.sh
# 检测用端口探测（curl）而非 pgrep 进程名，避免残留进程误判
# ============================================================
set -u
export PATH="/opt/data/home/.npm-global/bin:/opt/data/home/.local/share/pnpm:$PATH"
export HOME="/opt/data/home"

BLOG="/opt/data/workspace/blog"
cd "$BLOG" || exit 1

# 1. dev server —— 用端口探测确认真的在监听
if curl -s -o /dev/null --max-time 3 http://127.0.0.1:4321/ > /dev/null 2>&1; then
    echo "dev server already running on :4321"
else
    # 清理可能残留的僵尸进程（避免端口占用/日志错乱）
    for p in $(pgrep -f "astro.mjs dev" 2>/dev/null); do
        [ "$p" != "$$" ] && kill -9 "$p" 2>/dev/null
    done
    nohup pnpm dev --host > "$BLOG/dev-server.log" 2>&1 &
    echo "dev server starting (log: $BLOG/dev-server.log)"
fi

# 2. auto-sync
if pgrep -f "^bash $BLOG/auto-sync.sh" > /dev/null 2>&1; then
    echo "auto-sync already running"
else
    nohup bash "$BLOG/auto-sync.sh" > /dev/null 2>&1 &
    echo "auto-sync started (log: $BLOG/auto-sync.log)"
fi

sleep 5
echo "---"
echo "本地预览: http://localhost:4321/Myself_Astro/"
echo "局域网访问: http://<宿主机IP>:4321/Myself_Astro/  (需宿主机 socat 转发)"
