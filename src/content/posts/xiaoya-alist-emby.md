---
title: "小雅 Alist/Emby 全家桶搭建记录：免费影视库一条龙"
published: 2024-12-21
description: "从安装脚本到自动清理，从短 Token 到长 Token，把小雅 Alist、Emby、TVBox 一次串起来。纯教程向记录：公开链接、安装命令、清理模式都在，跟着跑就能搭出全家都能用的家庭影视库。"
tags: ["NAS", "小雅", "Alist", "Emby", "教程"]
category: "NAS"
draft: false
---

记录一下小雅媒体库的搭建过程。小雅本质上是把阿里云盘的影视资源通过 Alist 挂载出来，再用 Emby 刮削成媒体库，最后配合 TVBox 观看，一套免费影视全家桶。

## 教程与资源获取

完整教程（小雅媒体库 2024 最新全家桶）：[fuliapp.top/531.html](https://fuliapp.top/531.html)

两个关键 Token 的获取地址：

- 短 Token：[aliyuntoken.vercel.app](https://aliyuntoken.vercel.app/)
- 长 Token：[alist.nn.ci/tool/aliyundrive/request](https://alist.nn.ci/tool/aliyundrive/request)

还需要转存小雅的阿里云盘资源文件夹（公开分享链接，教程里有）。转存后拿到自己的文件夹 ID 备用。

## 安装小雅 Alist

```bash
bash -c "$(curl --insecure -fsSL https://ddsrem.com/xiaoya_install.sh)"
```

装完后用「你的 NAS 局域网地址:5678」能正常播放，就做一次更新：

```bash
bash -c "$(curl http://docker.xiaoya.pro/update_data.sh)"
```

## 小雅的自动清理

播放缓存会一直占空间，必须定时清理。小雅助手提供两种模式：

- **模式 3**：创建一个名为 xiaoyakeeper 的 docker 定时任务，运行小雅转存清理，并升级小雅镜像
- **模式 5（推荐）**：与模式 3 的区别是实时清理，只要产生播放缓存，一分钟内立即清理；签到和定时升级同模式 3

```bash
# 模式 3
bash -c "$(curl -sLk https://xiaoyahelper.ddsrem.com/aliyun_clear.sh | tail -n +2)" -s 3 -tg

# 模式 5（推荐）
bash -c "$(curl -sLk https://xiaoyahelper.ddsrem.com/aliyun_clear.sh | tail -n +2)" -s 5
```

## TVBox 配置

TVBox 配置地址格式：`http://你的NAS局域网地址:5678/tvbox/my.json`

TVBox APP 下载地址：[fuliapp.lanzoul.com/i3j7u1t1ahdc](https://fuliapp.lanzoul.com/i3j7u1t1ahdc)

## 我的安装记录

服务成功启动后，按使用需求访问以下入口：

- **Alist**：端口 5678，即小雅 Alist 主界面
- **WebDAV**：`/dav` 路径，默认账号 guest
- **TVBox 配置**：`/tvbox/my_ext.json`
- **Emby 全家桶**：端口 2345，默认账号 xiaoya

到这里，Alist + Emby + TVBox 就串起来了，浏览器访问 Emby 就能开始刮削和观看。后面记得跑自动清理，不然缓存会把盘塞满。
