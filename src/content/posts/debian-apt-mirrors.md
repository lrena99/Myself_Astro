---
title: "Debian 12 换国内 apt 源：三套配置直接抄"
published: 2025-03-10
description: "Debian 12 装完第一件事就是换源。整理了三套 /etc/apt/sources.list 配置：个人镜像、科大、清华，bookworm 直接复制即用，apt update 速度起飞，安全更新源也给你配好了。"
tags: ["Debian", "apt", "镜像源"]
category: "技术"
draft: false
image: "/images/covers/wall-08.webp"
---

Debian 装完第一件事永远是换源，不然 `apt update` 能卡到你怀疑人生。我攒了三套亲测可用的 bookworm 源配置，写进 `/etc/apt/sources.list` 就能用，直接抄作业。动手前建议先把旧配置备份一份，改坏了还能一键还原。

## 换源的正确姿势

1. 备份：`cp /etc/apt/sources.list /etc/apt/sources.list.bak`，给自己留条后路。
2. 编辑：`sudo nano /etc/apt/sources.list`（或者你顺手的编辑器），把内容整个换成下面某一套。
3. 生效：`sudo apt update`，让系统重新拉取软件列表。
4. 升级：`sudo apt upgrade`，把该更新的包更新一下。

## 第一套：朋友维护的镜像源

这套来自一个朋友（江湖人称"小草"）自己维护的镜像站，速度稳，用了挺久。不过这是私人镜像，域名涉及隐私，我就不贴出来了，下面用占位符代替。这套配置是从 buster 时代一路改过来的，升级到 bookworm 的时候记得把所有 buster 全部换成 bookworm，一行都不能漏。

```
# 把 mirrors.example.com 换成你自己的镜像域名
deb https://mirrors.example.com:7443/debian/ bookworm main contrib non-free
deb-src https://mirrors.example.com:7443/debian/ bookworm main contrib non-free
deb https://mirrors.example.com:7443/debian/ bookworm-updates main contrib non-free
deb-src https://mirrors.example.com:7443/debian/ bookworm-updates main contrib non-free
deb https://mirrors.example.com:7443/debian/ bookworm-backports main contrib non-free
deb-src https://mirrors.example.com:7443/debian/ bookworm-backports main contrib non-free
```

注意这套默认没有配安全更新源，需要的话可以把注释里的 security 源打开。另外它的端口是 7443，有点特别，抄的时候别把端口漏了。

## 第二套：中科大源（ustc）

科大源是老牌选手，量大管饱，稳定得一批，平时装软件基本够用：

```
# 默认注释了源码仓库，如有需要可自行取消注释
deb http://mirrors.ustc.edu.cn/debian bookworm main contrib non-free non-free-firmware
# deb-src http://mirrors.ustc.edu.cn/debian bookworm main contrib non-free non-free-firmware
deb http://mirrors.ustc.edu.cn/debian bookworm-updates main contrib non-free non-free-firmware
# deb-src http://mirrors.ustc.edu.cn/debian bookworm-updates main contrib non-free non-free-firmware

# backports 软件源，请按需启用
# deb http://mirrors.ustc.edu.cn/debian bookworm-backports main contrib non-free non-free-firmware
# deb-src http://mirrors.ustc.edu.cn/debian bookworm-backports main contrib non-free non-free-firmware
```

## 第三套：清华源

清华源配置最全，连安全更新源都给你写好了，懒人福音：

```
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware

deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware

deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware
# deb-src https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware

# 以下安全更新软件源包含了官方源与镜像站配置，如有需要可自行修改注释切换
deb https://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
# deb-src https://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
```

## 这些组件都是啥

- `main`：Debian 官方维护的自由软件，主力军。
- `contrib`：依赖非自由软件才能跑的自由软件，看情况启用。
- `non-free`：非自由软件，闭源驱动之类的东西，需要再开。
- `non-free-firmware`：固件包，bookworm 之后从 non-free 里单独分出来的组，装网卡、显卡固件会用到，建议保留。
- `bookworm-updates`：例行更新，一般开着。
- `bookworm-backports`：向后移植的新版本软件，按需启用。

## 几个小提示

- `deb-src` 是源码仓库，平时用不到就保持注释，能明显加快 `apt update`。
- backports 源按需启用，别一上来全开，不然装包的时候容易挑花眼。
- 安全更新源建议保留，尤其是跑在公网上的机器，保命要紧。
- 换完源记得先 `apt update` 再 `apt upgrade`，让新源生效，看到下载速度起飞就说明换对了。
- 如果是从老配置改过来的，记得把旧的发行版代号（比如 buster）全部换成 bookworm，漏一行都可能出问题。

三套里我最常用清华源，配置全、更新快，省心。祝你换源顺利，apt 秒下！
