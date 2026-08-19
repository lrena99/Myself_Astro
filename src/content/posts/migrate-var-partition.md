---
title: "把 /var 分区迁到新硬盘：前后两张分区表看懂一切"
published: 2025-01-20
description: "给服务器迁 /var 分区，笔记里只留下前后两张分区表快照。对比看：/var 从独立分区并回根分区，/tmp、/home 全合并，数据盘全部独立挂载，还多了一个 ZFS 池。"
tags: ["Linux", "分区", "数据迁移"]
category: "技术"
draft: false
---

这次给服务器把 /var 分区迁到新硬盘，折腾完发现笔记里只留了前后两张分区表快照，中间的操作步骤没记下来——不过光是这两张表，信息量已经很大了。

## 迁移前：9 个分区的老布局

迁移前系统盘是一块 447G 的盘，分区拆得很碎：

```
# lsblk
sda      8:0    0 447.1G  0 disk
├─sda1   8:1    0 167.7G  0 part /
├─sda2   8:2    0     1K  0 part
├─sda5   8:5    0  74.5G  0 part /var
├─sda6   8:6    0   1.9G  0 part /boot
├─sda7   8:7    0  14.9G  0 part [SWAP]
├─sda8   8:8    0  57.7G  0 part /tmp
└─sda9   8:9    0 130.4G  0 part /home
sdb      8:16   0   1.7T  0 disk /data1
sdc      8:32   0   1.7T  0 disk /data2
sdd      8:48   0   2.7T  0 disk /data3
sde      8:64   0  14.6T  0 disk
sdf      8:80   0  14.6T  0 disk
├─sdf1   8:81   0    16M  0 part
└─sdf2   8:82   0  14.6T  0 part
sdg      8:96   0  14.6T  0 disk
sdh      8:112  0  14.6T  0 disk
sdi      8:128  0  14.6T  0 disk
```

系统盘上 `/`、`/var`、`/boot`、`/tmp`、`/home` 各占一个分区，swap 也单独留了 14.9G。数据盘 sdb、sdc、sdd 分别挂 `/data1`、`/data2`、`/data3`，剩下的 14.6T 大盘基本还是裸盘。

## 迁移后：布局大变样

再看迁移之后的布局：

```
# lsblk
sda      8:0    0 447.1G  0 disk
├─sda1   8:1    0   953M  0 part /boot
├─sda2   8:2    0 418.3G  0 part /
└─sda3   8:3    0  27.9G  0 part [SWAP]
sdb      8:16   0   1.7T  0 disk
├─sdb1   8:17   0   700G  0 part /mnt/data1
└─sdb2   8:18   0   1.1T  0 part
sdc      8:32   0  14.6T  0 disk
└─sdc1   8:33   0  14.6T  0 part
sdd      8:48   0  14.6T  0 disk
└─sdd1   8:49   0  14.6T  0 part
sde      8:64   0   2.7T  0 disk
sdf      8:80   0  14.6T  0 disk
└─sdf1   8:81   0  14.6T  0 part
sdg      8:96   0  14.6T  0 disk
└─sdg1   8:97   0  14.6T  0 part
sdh      8:112  0   1.7T  0 disk
sdi      8:128  0  14.6T  0 disk
└─sdi1   8:129  0  14.6T  0 part
```

变化很明显：

- **系统盘从 9 个分区瘦身成 3 个**：`/var`、`/tmp`、`/home` 都不再单独占分区，全部并回了根分区，`/` 从 167.7G 涨到 418.3G。`/var` 迁移完成后就是根分区的一部分了，再也不用担心某个分区被日志写满。
- `/boot` 独立保留（953M），swap 给了 27.9G，都单独隔出来。
- 数据盘全部独立挂载：sdb1 挂 `/mnt/data1`，一堆 14.6T 大盘各自分了区。

另外 blkid 里能看到好几块 14.6T 的盘都是 `LABEL="share"`、`TYPE="zfs_member"`——也就是说这批大盘组成了一个 ZFS 存储池，这也是这次整理的一大收获：大容量存储交给 ZFS，系统盘只管跑系统。

## 一点心得

分区这事，能合并就别拆。以前 `/var`、`/tmp`、`/home` 各占一块，容量分配永远在纠结，迁完之后一个根分区全搞定，省心太多。唯一要记住的教训是：**动手前一定先留好分区表快照**，出问题还能照着恢复。
