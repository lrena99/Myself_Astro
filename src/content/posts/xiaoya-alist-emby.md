---
title: "小雅 Alist/Emby 全家桶搭建记录：免费影视库一条龙"
published: 2024-12-21
description: "从安装脚本到自动清理，从短 Token 到长 Token，把小雅 Alist、Emby、TVBox 一次串起来。纯教程向记录：公开链接、安装命令、清理模式都在，跟着跑就能搭出全家都能用的家庭影视库。"
tags: ["NAS", "小雅", "Alist", "Emby", "教程"]
category: "NAS"
draft: false
image: "/images/covers/wall-37.webp"
---

记录一下小雅媒体库的搭建过程。小雅本质上是把阿里云盘的影视资源通过 Alist 挂载出来，再用 Emby 刮削成媒体库，最后配合 TVBox 观看，一套免费影视全家桶。

说实话，第一次听说「免费影视库」我是有点怀疑的，但跟着教程一步步跑下来发现，还真就是一条龙：公开资源 + 一键脚本 + 自动清理，搭好之后全家老小都能看，真香。

## 教程与资源获取

完整教程（小雅媒体库 2024 最新全家桶）：[fuliapp.top/531.html](https://fuliapp.top/531.html)

两个关键 Token 的获取地址：

- 短 Token：[aliyuntoken.vercel.app](https://aliyuntoken.vercel.app/)
- 长 Token：[alist.nn.ci/tool/aliyundrive/request](https://alist.nn.ci/tool/aliyundrive/request)

Token 就是小雅访问你阿里云盘的门票，短的长的一个都不能少，教程里会教具体怎么填。另外还需要转存小雅的阿里云盘资源文件夹（公开分享链接：[alipan.com/s/vfkKNyJYvEi](https://www.alipan.com/s/vfkKNyJYvEi)），转存后拿到自己的文件夹 ID 备用。这里提醒一句：Token 和文件夹 ID 都是你的私有信息，千万别到处乱发。

## 安装小雅 Alist

一键脚本，复制粘贴就跑：

```bash
bash -c "$(curl --insecure -fsSL https://ddsrem.com/xiaoya_install.sh)"
```

装完之后，用「你的 NAS 局域网地址:5678」测试一下，能正常播放就算成了。确认能播，就再做一次更新：

```bash
bash -c "$(curl http://docker.xiaoya.pro/update_data.sh)"
```

## 小雅的自动清理

播放缓存会一直占空间，放着不管迟早把盘塞满，所以必须定时清理。小雅助手提供两种模式：

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

局域网地址我这里就统一用「NAS 局域网地址」代替了，IP 这种东西还是自己藏着好；默认账号的密码也建议改成自己的，笔记里就不写具体密码了，懂的都懂。

到这里，Alist + Emby + TVBox 就串起来了，浏览器访问 Emby 就能开始刮削和观看。后面记得跑自动清理，不然缓存会把盘塞满。
