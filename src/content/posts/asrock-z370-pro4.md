---
title: "NAS 主板折腾记录：150 块的华擎 Z370 Pro4 能装下什么"
published: 2024-12-17
description: "折腾 NAS 第一件事就是选板子。150 块淘来的华擎 Z370 Pro4：双 M.2、6 个 SATA、双 PCIe x16，还能点亮 ECC 内存条（虽然是非 ECC 模式）。Z370 时代白菜价的 NAS 潜力板，参数和取舍一次讲清楚。"
tags: ["NAS", "主板", "华擎", "Z370", "折腾"]
category: "NAS"
draft: false
image: "/images/covers/cover-03.webp"
---

折腾 NAS 绕不开选主板，我最后挑的是华擎 Z370 Pro4，150 块拿下。这块板子支持第八代酷睿（LGA1151），规格在同价位里相当能打，把关键参数和折腾要点整理成文。

![实物照片](/images/posts/asrock-z370-pro4/01.webp)

## 处理器与供电

- 支持第八代 Intel 酷睿处理器（1151 插槽），数字供电
- 支持 Intel Turbo Boost 2.0，也支持 K 系列不锁倍频处理器
- 支持华擎 BCLK 全范围超频

## 内存：能点亮 ECC 的意外之喜

- 双通道 DDR4，4 根插槽，最大 64GB
- 支持 DDR4 4266+(OC) 一路往下到 2133，第八代 CPU 最高支持 2666
- **支持 ECC UDIMM 内存模块（运行于非 ECC 模式）**——NAS 党看到这条会心动一下
- 支持 XMP 2.0，DIMM 插槽采用 15μ 镀金接针

## 存储：双 M.2 + 6 SATA

- 6 个 SATA3 6.0Gb/s，支持 RAID 0/1/5/10、NCQ、AHCI 和热插拔
- 2 个超级 M.2 接口（M2_1 / M2_2），支持 2230-2280 规格的 M.2 SATA 与 PCIe Gen3 x4（32Gb/s）模块
- 注意冲突：M2_1 被 SATA 型 M.2 占用时，SATA_5 关闭；M2_2 被占用时，SATA_0 关闭
- 支持 Intel 傲腾、NVMe SSD 开机，还支持华擎 U.2 套件

![实物照片](/images/posts/asrock-z370-pro4/02.webp)

## 扩展插槽

- 2 x PCIe 3.0 x16（PCIE2 为 x16 模式，PCIE4 为 x4 模式），支持 AMD Quad CrossFireX
- 3 x PCIe 3.0 x1，1 x PCI
- 1 x M.2 Key E 接口（2230 型 WiFi/BT 模块）
- 坑点：如果 PCIE5 或 PCI 被占用，PCIE4 会降为 x2 模式

## 网络与显示

- Intel I219V 千兆网卡，支持 Wake-On-LAN、PXE
- 8 个 USB 3.1 Gen1（1 个 Type-C，2 前置，5 后置）
- 显示输出：HDMI / DVI-D / D-Sub，支持三屏同时输出
- UHD 核显的 HWA 编解码覆盖 VP9、HEVC、AVC、MPEG2 等，看片转码够用
- 7.1 声道 Realtek ALC892，配 ELNA 专业音频电容

## 小结

150 块这个价位，Z370 Pro4 把 NAS 需要的扩展性给齐了：双 M.2、6 SATA、双 x16，核显硬解转码也顺手。ECC 内存能以非 ECC 模式点亮，属于白捡的彩蛋。Z370 时代的老板子，现在正是白菜价入手的时机，拿来当 NAS 主板再合适不过。
