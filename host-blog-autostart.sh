#!/bin/bash
# ============================================================
# host-blog-autostart.sh — 宿主机一键配置博客开机自启
# 在 Orange Pi 5 Max 宿主机（root）执行，只需一次：
#   1. hermes 容器开机自启（docker --restart=always）
#   2. 端口转发 systemd 服务开机自启（4321 -> 容器）
#   3. 验证
# 用法：sudo bash host-blog-autostart.sh
# ============================================================
set -e

echo "==> [1/4] 容器开机自启"
docker update --restart=always hermes
echo "    docker restart policy: $(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' hermes)"

echo "==> [2/4] 部署端口转发脚本"
cat > /usr/local/bin/blog-forward.sh <<'EOF'
#!/bin/bash
IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' hermes 2>/dev/null)
[ -z "$IP" ] && IP=172.18.0.2
exec socat TCP-LISTEN:4321,fork,reuseaddr TCP:${IP}:4321
EOF
chmod +x /usr/local/bin/blog-forward.sh

echo "==> [3/4] 部署 systemd 服务"
cat > /etc/systemd/system/blog-forward.service <<'EOF'
[Unit]
Description=Forward host :4321 to hermes container blog
After=docker.service network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/blog-forward.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now blog-forward
systemctl is-enabled blog-forward

echo "==> [4/4] 验证"
sleep 2
systemctl status blog-forward --no-pager | head -6
echo "---"
curl -s -o /dev/null -w "宿主机 4321 -> %{http_code}\n" --max-time 10 http://127.0.0.1:4321/Myself_Astro/ || echo "（容器内 dev server 可能还在启动，稍后重试即可）"
echo ""
echo "✅ 完成：容器与转发均开机自启；容器内 cron 每 5 分钟自动拉起博客服务"
