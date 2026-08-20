---
title: "150 元主板攒的 All-in-One NAS：我的 PVE 全家桶配置单"
published: 2024-12-21
description: "一台 NAS 能装几个系统？我的答案是 PVE + TrueNAS + WinServer + Debian 四合一。150 元华擎 Z370 Pro4、i3-8100、四块 HC550 组 RAID5，从核显拆分到 PCIe 拆分，完整硬件清单和踩坑记录都在这里。"
tags: ["NAS", "All-in-One", "PVE", "TrueNAS", "硬件"]
category: "NAS"
draft: false
image: "/images/covers/wall-22.webp"
---

## 参考

入坑前先看了这个视频：B 站《All In One NAS【开荒（踩坑）指南】》——PVE + Win + TrueNAS + Docker + 远程游戏 + 影音服务器一站式搭建，我的方案基本沿着这条路线走。视频标题里"踩坑"两个字特别诚实，因为我后面果然也跟着踩了几个，这篇就把我的配置单和坑位一起记下来。

![过程记录图](/images/posts/my-nas-all-in-one/01.webp)

## 硬件清单

### 主板：华擎 Z370 Pro4（150 元）

一块 150 块钱的主板，能不能撑起"全家桶 NAS"？Z370 Pro4 用事实回答：能。芯片组是 Intel Z370，支持第八代酷睿（1151 插槽），数字供电，支持 Intel Turbo Boost 2.0、K 系列不锁倍频处理器，还能玩华擎 BCLK 全范围超频——虽然 NAS 不折腾超频，但说明底子扎实。

内存方面：4 槽双通道 DDR4，最大 64GB，支持 ECC UDIMM 内存模块（运行于非 ECC 模式）。"支持 ECC"几个字对 NAS 党来说就是多巴胺，虽然不是真正的 ECC 模式运行，但起码能点亮，属于意外之喜。频率从 DDR4 4266+(OC) 一路支持到 2133，带 XMP 2.0，DIMM 插槽是 15μ 镀金接针，插拔耐久度更有底气。

存储接口是 NAS 最在意的部分：6 个 SATA3 6.0Gb/s，支持 RAID 0/1/5/10（Intel 快速存储技术 15）、NCQ、AHCI 和热插拔；再加 2 个超级 M.2 接口（M2_1 / M2_2），2230-2280 尺寸的 M.2 SATA 或 PCIe Gen3 x4（32Gb/s）模块都能插。注意一个坑：M2_1 被 SATA 型 M.2 占用时 SATA_5 会关闭，M2_2 被占用时 SATA_0 关闭——插盘之前先算好账，不然硬盘"凭空消失"可别怪我没提醒。还支持 Intel 傲腾、NVMe SSD 开机和华擎 U.2 套件。

扩展插槽：2 x PCIe 3.0 x16（PCIE2 全速 x16，PCIE4 走 x4）+ 3 x PCIe 3.0 x1 + 1 x PCI，支持 AMD Quad CrossFireX，另外还有一个 M.2 Key E 接口可以插 2230 型 WiFi/BT 模块。坑点也有：如果 PCIE5 或 PCI 被占用，PCIE4 会降为 x2 模式，直通设备分配之前得先规划好。

网卡是 Intel I219V 千兆，支持 Wake-On-LAN 和 PXE，还带防雷击 / 防 ESD 静电和 EEE 802.3az 节能。显示输出三件套 HDMI / DVI-D / D-Sub 支持三屏同显：HDMI 最大 4K x 2K（4096x2160）@30Hz，DVI-D 和 D-Sub 都是 1920x1200@60Hz，带 HDCP 和 4K Ultra HD 播放支持。核显硬解这块也齐全：DirectX 12，HWA 编解码覆盖 VP9 8/10-bit、VP8、HEVC、AVC、MPEG2、JPEG/MJPEG、VC-1，最大共享显存 1024MB——转码看片都不虚。

BIOS 是图形化多国语言的 128Mb AMI UEFI，符合 ACPI 6.0 兼容唤醒事件，支持 SMBIOS 2.7，DRAM、PCH 1.0V、VCCIO、VCCST、VCCSA、VPPM 电压都能调。音效是 7.1 声道 Realtek ALC892 + ELNA 专业音频电容，还支持优质蓝光音效和防突波。

板载接口也够全：COM 接针、TPM 接针、机箱开启警告接针、电源 LED 与扬声器接针；风扇接口有 CPU（4 针，最大 1A / 12W）、2 个机箱风扇和 1 个水泵风扇（最高 1.5A / 1.8W）；供电是 24 针 ATX + 8 针 12V；还有 Thunderbolt 接针（5 针）、3 x USB 2.0 针状接头（支持 5 个接口）和 1 x USB 3.1 Gen1 接针（2 个接口），都带 ESD 静电防护。后背板则是 2 个天线口、PS/2、D-Sub / DVI-D / HDMI、5 个 USB 3.1 Gen1 Type-A 加 1 个 Type-C、带指示灯的 RJ-45 网口和 HD 音频插孔。

150 块这个价格，扩展性在 NAS 场景里非常能打。

![实物照片](/images/posts/my-nas-all-in-one/02.webp)

### CPU：Intel i3-8100

NAS 的"大脑"不用多贵，够用 + 省电 + 带核显就是好 U。i3-8100：4 核 4 线程，基础频率 3.60 GHz，6MB 缓存，总线速度 8 GT/s，TDP 只有 65W——24 小时开机也不心疼电费。

内存规格：DDR4-2400，最大 64GB，双通道，最大内存带宽 37.5 GB/s，官方规格表里明确写着支持 ECC 内存。核显是 UHD Graphics 630——**支持 gvt-g 技术，可以虚拟化成两个**，分给多个虚拟机做硬件转码很方便；4K@60Hz 输出也支持（HDMI 下 4096x2304@24Hz，DP 下 4096x2304@60Hz）。虚拟化特性齐全：VT-x、VT-d、EPT 都有，还带 AES-NI 指令集，跑虚拟机是正儿八经的"科班出身"。

### 内存：DDR4 2400 16G x2（180 元）

两条 16G 组双通道，一共 32GB，180 元拿下。三个虚拟机加一堆服务同时跑，目前还没见过内存告急。NAS 内存不用追高频，2400 够用，稳定便宜才是王道。

### 硬盘

| 用途 | 型号 | 价格 |
| --- | --- | --- |
| PVE 系统盘 | RC20 1T | 300 元 |
| 下载盘 | PM883 960G | 250 元 |
| PVE 用机械盘 | 海康 4T（ST4000VX015） | 300 元 |
| TrueNAS RAID5 | HC550 x4 | 770 元/个 |

四块 HC550 直通给 TrueNAS 组 RAID5，专门管文件，是全家桶里最"贵"的角色；RC20 1T 装 PVE 系统，PM883 960G 当下载盘，海康 4T 机械盘（ST4000VX015）留给 PVE 自己用。各司其职，谁也不抢谁的活儿。

![硬盘照片](/images/posts/my-nas-all-in-one/03.webp)

### 机箱

本地捡的 EATX 大机箱，空间管够。四块机械盘 + 三块固态 + 主板全塞进去还有富余，理线都变得轻松，捡来的快乐就是这么朴实无华。

## 折腾步骤

### 1. 核显拆分

UHD 630 通过 gvt-g 拆成两个虚拟显卡，分给不同的虚拟机用——一个给 Win 当下载机加速，一个给 Debian 跑服务，互不打架。相当于把一块核显掰成两半，一半伺候一个系统，硬件转码这活儿从此不用麻烦 CPU 了。

### 2. PCIe 拆分

把 PCIe 通道拆开，让直通设备各归其位，硬盘阵列卡和万兆网卡才能同时用。通道就那么几根，不拆开的话设备只能排队等，拆开之后各走各的，互不堵车。

![过程记录图](/images/posts/my-nas-all-in-one/04.webp)

### 3. PVE 上装三个系统

- **TrueNAS**：纯管理文件，四块 HC550 的 RAID5 归它管
- **WinServer 2025**：当下载机用
- **Debian 12**：跑各种服务

![PVE 虚拟机列表截图](/images/posts/my-nas-all-in-one/08.webp)

## 成果

![PVE 节点概览：CPU、内存与存储状态](/images/posts/my-nas-all-in-one/05.webp)

![PVE 节点监控：风扇转速与 CPU 温度](/images/posts/my-nas-all-in-one/06.webp)

![TrueNAS SCALE 仪表盘：系统信息与存储池状态](/images/posts/my-nas-all-in-one/07.webp)

![装机实物照](/images/posts/my-nas-all-in-one/09.webp)

## 小结

这套 All-in-One 的核心思路就一句话：一块便宜的 Z370 老主板 + 带核显的 i3，用 PVE 把存储（TrueNAS）、下载（WinServer）和服务（Debian）全塞进一台机器。核显拆分和 PCIe 拆分是两个关键步骤，折腾完就是一台能装下全家桶的 NAS。整机预算的大头全在硬盘上，板 U 内存加起来不到 400 块——这种"老平台白菜价"的玩法，性价比是真的香。
