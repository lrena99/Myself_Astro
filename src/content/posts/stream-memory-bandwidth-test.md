---
title: "给内存带宽测个速：STREAM 单核/多核测试一条龙"
published: 2025-01-31
description: "内存带宽到底够不够？别猜，跑一遍 STREAM 就知道了。下载源码、两条 gcc 命令分别编译出单核和多核版本、执行看结果，全程五分钟。附完整命令，拿去就能用。"
tags: ["STREAM", "内存带宽", "性能测试"]
category: "技术"
draft: false
---

想知道一台机器的内存带宽有多少，最常用的工具就是 STREAM。它通过大规模数组的读写操作来测内存的实际吞吐，比看参数表靠谱多了。

## 下载源码

STREAM 官方源码就一个文件，直接下载：

```shell
wget http://www.cs.virginia.edu/stream/FTP/Code/stream.c
```

## 编译：单核版和多核版

编译时有两个关键点：`-O3` 优化，以及是否加 `-fopenmp` 开启多线程。

多核测试版（开 OpenMP 多线程）：

```shell
gcc -mtune=native -march=native -O3 -mcmodel=medium -fopenmp -DSTREAM_ARRAY_SIZE=100000000 -DNTIMES=40 stream.c -o stream.o
```

单核测试版（不加 `-fopenmp`）：

```shell
gcc -mtune=native -march=native -O3 -mcmodel=medium -DSTREAM_ARRAY_SIZE=100000000 -DNTIMES=40 stream.c -o stream.o1
```

其中 `-DSTREAM_ARRAY_SIZE=100000000` 把数组设成 1 亿个元素，数据量远超 CPU 缓存，保证测的是真实内存带宽而不是缓存；`-DNTIMES=40` 表示每项测试跑 40 次。

## 执行

```shell
./stream.o1   # 单核测试
./stream.o    # 多核测试
```

## 看什么

输出里重点看 Copy、Scale、Add、Triad 四项的带宽数值（MB/s）。单核版本代表单条线程能跑到的上限，多核版本能看到多核并行对带宽的压榨效果——内存带宽往往是多核机器更容易撞到的瓶颈。

想对比不同机器，或者验证超频、换内存条前后的差异，用同一套参数跑就完事了，结果一目了然。
