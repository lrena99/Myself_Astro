---
title: "Debian 12 换国内 apt 源：三套配置直接抄"
published: 2026-08-19
description: "Debian 12 装完第一件事就是换源。整理了三套 /etc/apt/sources.list 配置：个人镜像、科大、清华，bookworm 直接复制即用，apt update 速度起飞，安全更新源也给你配好了。"
tags: ["Debian", "apt", "镜像源"]
category: "技术"
---

Debian 装完第一件事永远是换源，不然 `apt update` 能卡到你怀疑人生。我整理了三套亲测可用的 bookworm 源配置，写进 `/etc/apt/sources.list` 就能用。

## 第一套：个人维护的镜像源

朋友维护的一个镜像站，速度稳定，配置如下：

```
deb https://mirrors.cyxc.club:7443/debian/ bookworm main contrib non-free
deb-src https://mirrors.cyxc.club:7443/debian/ bookworm main contrib non-free
deb https://mirrors.cyxc.club:7443/debian/ bookworm-updates main contrib non-free
deb-src https://mirrors.cyxc.club:7443/debian/ bookworm-updates main contrib non-free
deb https://mirrors.cyxc.club:7443/debian/ bookworm-backports main contrib non-free
deb-src https://mirrors.cyxc.club:7443/debian/ bookworm-backports main contrib non-free
```

注意这套没有配安全更新源，需要的话可以把注释里的 security 源打开。

## 第二套：中科大源（ustc）

科大源是老牌选手，量大管饱：

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

清华源配置最全，连安全更新源都给你写好了：

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

## 几个小提示

- `deb-src` 是源码仓库，平时用不到就保持注释，能明显加快 `apt update`。
- backports 源按需启用，别一上来全开。
- 安全更新源建议保留，尤其是跑在公网上的机器。
- 换完源记得 `apt update` 一下再 `apt upgrade`。

三套里我最常用清华源，配置全、更新快，省心。
