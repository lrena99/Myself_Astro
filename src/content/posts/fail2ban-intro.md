---
title: "SSH 一直被爆破？装个 Fail2Ban 自动拉黑"
published: 2024-12-21
description: "服务器日志里全是陌生 IP 的登录尝试？Fail2Ban 就是干这个的：盯着系统日志，发现多次登录失败的 IP 直接拉黑。安装、配置 SSH 监控、看封禁效果，三步讲清楚，新手也能照做。"
tags: ["fail2ban", "安全", "SSH"]
category: "技术"
draft: false
image: "/images/covers/wall-15.webp"
---

如果你有一台暴露在公网上的 Linux 服务器，大概率在日志里见过一堆陌生 IP 的 SSH 登录尝试。它们像半夜敲门的人，一遍遍试密码，试完就走，换个 IP 接着来。手动一个个拉黑不现实，Fail2Ban 就是专门解决这个问题的。

## Fail2Ban 是什么

Fail2Ban 是一个安全工具，核心思路很简单：监控系统日志，识别异常行为，然后自动采取行动——在指定时间内，把多次登录失败的 IP 地址自动禁止掉。

它的工作可以拆成三步：先从系统日志里"读"，再用内置规则"判断"哪些行为算异常，最后交给防火墙"动手"拉黑。整个过程不用人盯着。它相当于给 SSH 装了个门卫：谁反复输错密码，直接拒之门外，不用你手动干预。

## 安装

Debian/Ubuntu 一条命令：

```bash
apt install fail2ban
```

装完服务会自动启动，默认配置里已经带好了 sshd 的监控规则（jail），开箱就能用。

## 配置 SSH 监控

默认配置已经带上了 sshd 的监控规则（jail），一般只需要写一个自己的配置文件来覆盖默认值：

```ini
# /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 5
bantime = 3600
```

几个参数的含义：

- `maxretry = 5`：失败 5 次就触发
- `bantime = 3600`：封禁 1 小时（单位秒）
- `enabled = true`：启用 sshd 这条规则

顺带一提，jail 里还有个 `findtime`，表示统计失败次数的时间窗口，默认是 10 分钟——也就是"10 分钟内失败 5 次"才算数。想严格点就把窗口调短、次数调低，想宽松就反过来。

改完重启服务生效：

```bash
systemctl restart fail2ban
```

## 验证效果

```bash
fail2ban-client status sshd
```

能看到当前被 ban 的 IP 列表，心里就有底了。输出里的 `Banned IP list` 会列出每个被拉黑的 IP 和封禁时长，谁在撞你的门一目了然。想手动放行某个 IP，用 `fail2ban-client set sshd unbanip <IP>` 就行；想翻封禁历史，看 `/var/log/fail2ban.log`。想随时知道服务状态，`systemctl status fail2ban` 一眼就能确认。

除了 sshd，Fail2Ban 还能给别的服务看门：邮件服务、Web 服务、FTP，凡是日志里能看出"反复失败"的地方，都可以照葫芦画瓢加一条 jail，套路完全一样。

## 几个提醒

- 默认的 `ignoreip` 已经包含本机回环地址（`127.0.0.1/8`、`::1`），如果你有固定的管理 IP，也可以加进去，避免把自己误封
- 封禁时长按需调整，公网扫描是常态，默认值起步就够用
- 定期看一眼封禁列表，能摸清扫描的规律，也方便确认规则确实在工作
- 改完配置记得 restart，不然新规则不生效

装好之后最大的感受就是：日志终于安静了，服务器也能睡个安稳觉了。
