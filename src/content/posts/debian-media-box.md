---
title: "给 Debian 做个药盒包装：这个项目太会玩了"
published: 2025-01-24
description: "Debian 的 logo 和某款药长得太像，于是有人做了个能打印的 Debian 药盒包装设计：300g 铜版纸、TIF 打印、沿线裁剪折叠，连说明书都有。喷墨打印光面铜版纸会掉色，别问我怎么知道的。"
tags: ["Debian", "好玩", "DIY"]
category: "折腾"
draft: false
image: "/images/covers/wall-10.webp"
---

刷 GitHub 的时候，我刷到一个特别有意思的项目：[debian-media-box](https://github.com/moesoha/debian-media-box)。

事情是这样的：Debian 的 logo 和某款药品长得实在太像了，网上一直流传着「Debian 药」的梗，好多人看到那个 swirl 标志，第一反应都是「这不是那盒药吗」。而这个项目干脆把梗变成实物——设计了一个专门用来包装 Debian 安装介质的药盒，平面设计全部开源，下载打印、自己折叠就能用。把社区梗做成实体周边，还免费开源，这操作我真的会谢。

![灵感来源：Debian logo 和药品的对比图](/images/posts/debian-media-box/04.webp)

上面这张就是梗的来源：Debian 的 logo 和那款药放在一起对比，像得离谱。作者也在介绍里说了，设计灵感正是来自这个梗，盒子的设计跟它如出一辙。

![实物照片](/images/posts/debian-media-box/01.webp)

## 怎么做

做起来其实不复杂，就两步：打印盒子、打印说明书。

- 在项目的 [Release 页面](https://github.com/moesoha/debian-media-box/releases/latest) 下载 PDF 或其他格式的档案打印。
- **包装盒**：建议用足够大的 300g 铜版纸，光面打印包装盒的 TIF 文件（推荐），或者 PDF 文档的第一页，然后沿线裁下、粘胶折叠。设计里加了辅助线方便制作，嫌影响美观可以自己删掉。
- **说明书**：随便用各种 A4 纸打印就行；想用其他尺寸的纸，可以下载 `instruction.tex` 改参数重新编译成 PDF 再打印。

![实物照片](/images/posts/debian-media-box/02.webp)

## 几个避坑提醒

- **喷墨打印机打光面铜版纸很容易掉色**，有条件用激光打印。别问我怎么知道的，光面铜版纸遇上喷墨，那效果一言难尽。
- 项目还专门有个 issue 讲「严禁用于服务器安装」，这是玩梗——毕竟这是药盒包装，不是真的服务器安装介质，别误会。

## 参数

包装盒尺寸：85 x 19 x 84（毫米），小小一个，正好装下 Debian 安装盘。

![实物照片](/images/posts/debian-media-box/03.webp)

这种把社区梗做成实物还开源的设计，真的太戳我了。作者也很欢迎大家提 issue 和 PR，对包装和说明书有什么改进建议都可以直接去说。感兴趣的话，直接去仓库下载文件打印一个，摆桌上当装饰都很有梗。
