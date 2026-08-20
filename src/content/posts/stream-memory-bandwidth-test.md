---
title: "给内存带宽测个速：STREAM 单核/多核测试一条龙"
published: 2025-01-31
description: "内存带宽到底够不够？别猜，跑一遍 STREAM 就知道了。下载源码、两条 gcc 命令分别编译出单核和多核版本、执行看结果，全程五分钟。附完整命令，拿去就能用。"
tags: ["STREAM", "内存带宽", "性能测试"]
category: "技术"
draft: false
image: "/images/covers/wall-30.webp"
---

想知道一台机器的内存带宽有多少，最常用的工具就是 STREAM。它通过大规模数组的读写操作来测内存的实际吞吐，比看参数表靠谱多了——参数表上标的理论带宽再漂亮，也不如让数据真的在内存里跑一圈来得实在。

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

几个参数都挺有讲究：

- 数组为什么这么大？缓存是内存的"小甜心"，要是数组小到能整个塞进缓存，测出来的就是缓存速度——动辄几十 GB/s 的"漂亮数字"，根本不是内存的真实水平。1 亿个 double 就是 800MB，稳稳超出缓存，逼着 CPU 老老实实去内存里搬数据；
- 为什么要 `-mcmodel=medium`？数组太大，默认的小内存模型放不下静态分配的大数组，换成 medium 模型才能正常编译链接；
- `-mtune=native -march=native` 则是让编译器照着当前 CPU 的指令集火力全开地优化，把硬件潜力榨干；
- 多核版本靠 `-fopenmp` 拉起多个线程一起搬数据，正好看看多核并行能把带宽推到多高。

## 执行

```shell
./stream.o1   # 单核测试
./stream.o    # 多核测试
```

跑之前留意一下机器内存：数组大，测试占用的内存也跟着大，别把机器跑得嗷嗷叫。反正单核先跑、多核再跑，两条命令的事。

## 看什么

输出里重点看 Copy、Scale、Add、Triad 四项的带宽数值（MB/s）：

- **Copy**：把一块数组原样拷到另一块，最纯粹的内存搬运；
- **Scale**：给每个元素乘个常数再写回去，读写各一次；
- **Add**：两个数组相加，结果写进第三个；
- **Triad**：先乘后加，最接近真实程序里"读两个、算一下、写一个"的混合负载。

单核版本代表单条线程能跑到的上限，多核版本能看到多核并行对带宽的压榨效果——内存带宽往往是多核机器更容易撞到的瓶颈。核一多，算力上去了，可内存还是那一条通道，大家挤在一起抢带宽，内存就成了天花板。

想对比不同机器，或者验证超频、换内存条前后的差异，用同一套参数跑就完事了，结果一目了然。
