---
title: "acme.sh 免费 HTTPS 证书：一次配置，自动续期"
published: 2024-12-22
description: "给自建网站和家庭内网服务上 HTTPS 一直嫌麻烦？我用 acme.sh 几分钟就搞定：一条命令装好，自动注册 cron 定时任务，证书到期自己续，一次配置长期生效。附完整安装日志。"
tags: ["acme.sh", "SSL证书", "HTTPS"]
category: "技术"
draft: false
image: "/images/covers/cover-03.webp"
---

给自建网站、NAS 和家庭内网服务配 TLS 加密这件事，我一直嫌麻烦，拖了很久。这次看了个视频教程，再对照 acme.sh 官方仓库，把免费 HTTPS 证书的事彻底解决了，记录一下。

## 参考的资料

- B 站视频：《三行命令，免费申请 https 加密证书，一次配置，永久生效》，讲的就是 NAS/家庭内网服务配置 TLS 加密、自建网站配置 SSL/TLS 证书的流程：[BV1UNzmYpEZz](https://www.bilibili.com/video/BV1UNzmYpEZz/)
- acme.sh 官方仓库：[github.com/acmesh-official/acme.sh](https://github.com/acmesh-official/acme.sh)

## 部署记录

acme.sh 是一个 ACME 客户端，用来免费申请证书，安装过程一条命令搞定。我装在 Debian 12 上，安装时它会自动做几件事：安装到用户目录、往 `.bashrc` 里写别名、注册 cron 定时任务（这就是"一次配置永久生效"的关键——证书快到期了会自动续期），还会把脚本的 shebang 换成 bash。

当时的安装日志：

```
[2024年 12月 22日 星期日 13:28:27 CST] Installing to /root/.acme.sh
[2024年 12月 22日 星期日 13:28:27 CST] Installed to /root/.acme.sh/acme.sh
[2024年 12月 22日 星期日 13:28:28 CST] Installing alias to '/root/.bashrc'
[2024年 12月 22日 星期日 13:28:28 CST] Close and reopen your terminal to start using acme.sh
[2024年 12月 22日 星期日 13:28:28 CST] Installing cron job
[2024年 12月 22日 星期日 13:28:28 CST] bash has been found. Changing the shebang to use bash as preferred.
[2024年 12月 22日 星期日 13:28:29 CST] OK
```

装完之后关掉终端重开，`acme.sh` 命令就能用了。后续就是按官方文档申请证书、把证书安装到自己的服务里，因为 cron 任务已经就位，后面基本不用再管它。
