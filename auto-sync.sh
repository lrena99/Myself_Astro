#!/bin/bash
# ============================================================
# auto-sync.sh — 监听博客目录变化，自动 commit + push 到 GitHub
# 触发后 GitHub Actions 自动重新部署到 Pages
# ============================================================
set -u

export PATH="/opt/data/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i /opt/data/home/.ssh/lrena_hermes_auto -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=no"

REPO_DIR="/opt/data/workspace/blog"
cd "$REPO_DIR" || exit 1

git config user.name "lrena99"
git config user.email "2564994051@qq.com"

LOG="/opt/data/workspace/blog/auto-sync.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

log "auto-sync started (polling every 30s)"

while true; do
    sleep 30

    # 有未提交变化（含 untracked 文件）才继续
    if [ -z "$(git status --porcelain)" ]; then
        continue
    fi

    # 等文件写稳定（连续两次检查一致才提交，避免半截文件）
    first_hash=$(git status --porcelain | md5sum)
    sleep 20
    second_hash=$(git status --porcelain | md5sum)
    if [ "$first_hash" != "$second_hash" ]; then
        log "changes still in flux, waiting..."
        continue
    fi

    git add -A
    if git diff --cached --quiet; then
        continue
    fi

    git commit -m "content: auto-sync $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG" 2>&1

    # push 带 3 次重试
    pushed=0
    for attempt in 1 2 3; do
        if git push origin main >> "$LOG" 2>&1; then
            pushed=1
            break
        fi
        log "push attempt $attempt failed, retrying..."
        sleep 15
    done

    if [ "$pushed" = "1" ]; then
        log "pushed: $(git log -1 --oneline)"
    else
        log "PUSH FAILED after 3 attempts"
    fi
done
