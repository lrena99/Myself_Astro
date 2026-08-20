---
title: "在 Debian 12 上硬装 PVE：我替你试了，Ubuntu 不行"
published: 2025-01-21
description: "不想重装系统，想直接在 Debian 12 上把 PVE 装出来？这份踩坑全记录拿走：加源、装内核、删旧内核、桥接网卡，一步不落。记住一句话：我替你试了，Ubuntu 不行。"
tags: ["PVE", "Debian", "虚拟化"]
category: "技术"
draft: false
image: "/images/covers/wall-12.webp"
---

网上 PVE 的安装教程基本都是「下载官方 ISO 装一遍」，但如果你已经有一台 Debian 12 的机器、又不想重装系统，直接在上面装 PVE 也是可行的。网上关于这条路子的资料不多，我踩完坑，把完整流程记下来，能帮一个是一个。

## 1. 安装 Debian 12 Bookworm

具体安装方法网上教程很多，这里不重复。

**注意：一定要用 Debian 12**，并不是所有基于 Debian 12 的系统都能装成功——我替你试了，起码 **Ubuntu 不行**。老老实实用原版 Debian 12，别整花活。

## 2. 设定静态 IP（可选）

PVE 官方在网页管理界面里强制要求静态 IP，虽然通过直接改配置也能让它用 DHCP，但万一拿不到地址，面板就访问不到了，我不推荐这么干。

安装期间面板可能会改动网络设置，所以**建议在装 PVE 之前就设好静态 IP**。可以改 `/etc/network/interfaces` 配置文件，不过用图形界面设置更不容易出错。

## 3. 设置计算机名与域名

集群等功能依赖主机名和域名解析，需要专门设置。修改 `/etc/hosts` 这个本地 DNS 文件，我计算机名起的 debian-pve，给本机地址加一条对应的解析，改成你自己的 IP 即可。

计算机名在装 Debian 时就会设定，也可以改 `/etc/hostname` 文件。**注意：如果要使用 PVE 集群功能，计算机名不能重复**。

## 4. apt 安装各种包

### a. 加入 PVE 的源

```bash
echo "deb [arch=amd64] http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-install-repo.list
```

添加 PVE 储存库验证密钥：

```bash
wget https://enterprise.proxmox.com/debian/proxmox-release-bookworm.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-bookworm.gpg
```

也可以换第三方镜像源，不过官方源裸连速度其实还行，我就没换。

科大源版本：

```bash
echo "deb https://mirrors.ustc.edu.cn/proxmox/debian bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list
wget https://mirrors.ustc.edu.cn/proxmox/debian/proxmox-release-bookworm.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-bookworm.gpg
```

清华源版本：

```bash
echo "deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list
wget -qO- https://enterprise.proxmox.com/debian/proxmox-release-bookworm.gpg | apt-key add -
```

### b. apt 更新

```bash
apt update && apt full-upgrade
```

### c. 安装 PVE 内核并重启

```bash
apt install proxmox-default-kernel
systemctl reboot
```

### d. 安装 PVE 所需的包

```bash
apt install proxmox-ve postfix open-iscsi chrony
```

安装过程中会出现一个弹窗，按 Tab 键选择下面的标记确认即可。完成后试着访问 `https://你的IP:8006`，不出意外就已经能打开 PVE 面板了。

![截图](/images/posts/debian12-install-pve/01.webp)

### e. 删除旧的 Debian 内核

```bash
apt remove linux-image-amd64 'linux-image-6.1*'
```

### f. 更新引导

```bash
update-grub
```

### g. 删除 os-prober 软件包

```bash
apt remove os-prober
```

这个包可能会把虚拟机磁盘的分区也扫出来当引导项，建议删掉。

## 5. PVE 面板网络设置（重要‼️）

PVE 默认用网桥桥接物理网卡，同时在网桥上配置 IP 来访问主机。**这一步必须通过面板再设置一次，否则重启网络后主机会没有 IP 地址**。

### a. 创建 Linux Bridge

在面板里新建一个 Linux 网桥。

### b. 把网卡桥接到 Bridge 上，设置静态 IP 与网关

看你自己的以太网端口叫什么名字，「桥接端口」就填什么。给网桥配上静态 IP 和网关，保存应用。

## 6. 安装完成

装完跟正常的 PVE 一样用，区别是存储直接用的根目录，没有再分成 local 和 local-lvm。同时原来的桌面 GUI 也正常工作，系统没被 PVE 弄坏，等于白捡一个虚拟化平台，原来的桌面环境还完好无损。

一路踩下来最大的心得就一句：**系统老老实实用 Debian 12 原版**，其他衍生版真的会坑你。我替你试过了，Ubuntu 那条路走不通，别在这上面浪费时间。

如果有同学也想这么干，我的建议是先备份、再动手，每一步都按上面来，尤其别跳过第 5 步的面板网络设置——那一步才是最容易翻车的隐藏大坑。
