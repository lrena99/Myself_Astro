---
title: "150 元主板攒的 All-in-One NAS：我的 PVE 全家桶配置单"
published: 2024-12-21
description: "一台 NAS 能装几个系统？我的答案是 PVE + TrueNAS + WinServer + Debian 四合一。150 元华擎 Z370 Pro4、i3-8100、四块 HC550 组 RAID5，从核显拆分到 PCIe 拆分，完整硬件清单和踩坑记录都在这里。"
tags: ["NAS", "All-in-One", "PVE", "TrueNAS", "硬件"]
category: "NAS"
draft: false
---

## 参考

入坑前先看了这个视频：B 站《All In One NAS【开荒（踩坑）指南】》——PVE + Win + TrueNAS + Docker + 远程游戏 + 影音服务器一站式搭建，我的方案基本沿着这条路线走。

## 硬件清单

### 主板：华擎 Z370 Pro4（150 元）

支持第八代酷睿（1151 插槽），数字供电，支持 K 系列不锁倍频和 BCLK 全范围超频。内存 4 槽双通道 DDR4，最大 64GB，支持 ECC UDIMM（运行于非 ECC 模式）。存储有 6 个 SATA3 + 2 个超级 M.2（PCIe Gen3 x4），M.2 占用时分别关闭对应 SATA。扩展是 2 x PCIe 3.0 x16 + 3 x PCIe x1 + 1 x PCI，网卡是 Intel I219V 千兆。150 块这个价格，扩展性在 NAS 场景里非常能打。

### CPU：Intel i3-8100

4 核 4 线程，基础频率 3.60 GHz，6MB 缓存，TDP 65W。内存规格支持 DDR4-2400，官方规格表里显示支持 ECC 内存。核显是 UHD Graphics 630——**支持 gvt-g 技术，可以虚拟化成两个**，分给多个虚拟机做硬件转码很方便。虚拟化特性齐全：VT-x、VT-d、EPT 都有。

### 内存：DDR4 2400 16G x2（180 元）

### 硬盘

| 用途 | 型号 | 价格 |
| --- | --- | --- |
| PVE 系统盘 | RC20 1T | 300 元 |
| 下载盘 | PM883 960G | 250 元 |
| PVE 用机械盘 | 海康 4T（ST4000VX015） | 300 元 |
| TrueNAS RAID5 | HC550 x4 | 770 元/个 |

四块 HC550 直通给 TrueNAS 组 RAID5，专门管文件。

### 机箱

本地捡的 EATX 大机箱，空间管够。

## 折腾步骤

### 1. 核显拆分

UHD 630 通过 gvt-g 拆成两个虚拟显卡，分给不同的虚拟机用——一个给 Win 当下载机加速，一个给 Debian 跑服务，互不打架。

### 2. PCIe 拆分

把 PCIe 通道拆开，让直通设备各归其位，硬盘阵列卡和万兆网卡才能同时用。

### 3. PVE 上装三个系统

- **TrueNAS**：纯管理文件，四块 HC550 的 RAID5 归它管
- **WinServer 2025**：当下载机用
- **Debian 12**：跑各种服务

## 小结

这套 All-in-One 的核心思路就一句话：一块便宜的 Z370 老主板 + 带核显的 i3，用 PVE 把存储（TrueNAS）、下载（WinServer）和服务（Debian）全塞进一台机器。核显拆分和 PCIe 拆分是两个关键步骤，折腾完就是一台能装下全家桶的 NAS。
