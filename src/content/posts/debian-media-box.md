---
title: "给 Debian 做个药盒包装：这个项目太会玩了"
published: 2025-01-24
description: "Debian 的 logo 和某款药长得太像，于是有人做了个能打印的 Debian 药盒包装设计：300g 铜版纸、TIF 打印、沿线裁剪折叠，连说明书都有。喷墨打印光面铜版纸会掉色，别问我怎么知道的。"
tags: ["Debian", "好玩", "DIY"]
category: "折腾"
draft: false
image: "/images/covers/cover-08.webp"
---

刷 GitHub 的时候发现一个特别有意思的项目：[debian-media-box](https://github.com/moesoha/debian-media-box)。因为 Debian 的 logo 和某款药品长得十分相似，网上一直有「Debian 药」的梗，这个项目干脆把梗变成实物——一个专门用来包装 Debian 安装介质的药盒，平面设计全部开源，打印出来自己折叠就能用。

## 怎么做

- 在项目的 [Release 页面](https://github.com/moesoha/debian-media-box/releases/latest) 下载 PDF 或其他格式的档案打印。
- **包装盒**：建议用足够大的 300g 铜版纸，光面打印包装盒的 TIF 文件（推荐），或者 PDF 文档的第一页，然后沿线裁下、粘胶折叠。设计里加了辅助线方便制作，嫌影响美观可以自己删掉。
- **说明书**：随便用各种 A4 纸打印就行；想用其他尺寸的纸，可以下载 `instruction.tex` 改参数重新编译成 PDF 再打印。

## 几个避坑提醒

- **喷墨打印机打光面铜版纸很容易掉色**，有条件用激光打印。
- 项目还专门有个 issue 讲「严禁用于服务器安装」，这是玩梗——毕竟这是药盒包装，不是真的服务器安装介质，别误会。

## 参数

包装盒尺寸：85 x 19 x 84（毫米），小小一个，正好装下 Debian 安装盘。

这种把社区梗做成实物还开源的设计，真的太戳我了。感兴趣的直接去仓库下载文件打印一个，摆桌上当装饰都很有梗。
