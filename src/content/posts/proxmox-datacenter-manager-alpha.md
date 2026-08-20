---
title: "Proxmox Datacenter Manager 首个 Alpha 发布：多节点管理要统一了？"
published: 2024-12-19
description: "Proxmox 官方发布了 Datacenter Manager 的第一个 Alpha 版本：全 Rust 重写、集中管理所有节点和集群、免集群网络迁移虚拟机。这篇整理了公告里的核心信息：它是什么、为什么发 Alpha、怎么装、第一步怎么用，以及我对这台管理器的期待。"
tags: ["Proxmox", "PVE", "虚拟化", "homelab"]
category: "折腾"
draft: false
image: "/images/covers/wall-44.webp"
---

# Proxmox Datacenter Manager 首个 Alpha 发布：多节点管理要统一了？

看到 Proxmox 官方论坛发了 Datacenter Manager 第一个 Alpha 的公告，赶紧把重点记下来。作为一个在 PVE 里折腾多台机器的人，这东西要是好用，以后管理一堆节点和集群就不用挨个开网页了。

## 它是什么？

Proxmox Datacenter Manager（PDM）的目标很简单：**给所有单个节点和集群提供一个集中概览**，还能做基本管理，比如**迁移虚拟来宾（虚拟机/容器）**——注意，**不需要任何集群网络要求**。也就是说，以前想迁移 VM 得先组 Proxmox 集群，现在跨机器挪虚拟机可能不再受这个限制。

更让我意外的是这个项目的技术选型：**完全用 Rust 开发**，从后端 API 服务器到 CLI 工具，再到全新的前端。前端还是基于 Proxmox 自己这几年打磨的小部件工具包做的，公告说在外观、功能、可访问性、速度和兼容性上都比老界面现代。

![PDM 管理界面（官方论坛截图）](/images/posts/proxmox-datacenter-manager-alpha/01.webp)

![PDM 界面细节（官方论坛截图）](/images/posts/proxmox-datacenter-manager-alpha/02.webp)

## 为什么急着发 Alpha？

官方理由很实在：

- **获取反馈**：想知道哪些功能有用、哪些没用、大家想要什么改进；
- **测试核心功能**：在进 Beta 之前尽早发现 bug、优化功能；
- **跟社区合作**：让用户意见参与塑造这个产品。

所以对这个 Alpha 的期待也别拉满——有些功能还在开发或不完整，文档也还在写，遇到 bug 属于预期内的事，官方鼓励直接上报。

## 怎么装？

两条路：用官方 ISO 在虚拟机或裸机上装，或者**在现有的 Debian Bookworm 基础上直接叠加安装**：

```bash
echo 'deb http://download.proxmox.com/debian/pdm bookworm pdm-test' >/etc/apt/sources.list.d/pdm-test.list
wget https://enterprise.proxmox.com/debian/proxmox-release-bookworm.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-bookworm.gpg
apt update
apt install proxmox-datacenter-manager proxmox-datacenter-manager-ui
```

装完浏览器访问 `https://IP-OR-HOSTNAME:8443`，用 `root@pam` 登录。

## 第一步：接入你的第一台 PVE

装完之后最重要的一件事：**添加第一个 Proxmox VE 远程节点**。在控制面板或 Remotes（远程）面板打开向导，输入节点的 URL 和 root 或管理员凭据（也可以用 API token）。

两个细节值得注意：

1. **自签名证书要填 TLS 指纹**：如果节点证书是自签的，得去 PVE 的 Web 界面找到对应证书条目，把指纹复制过来填上，保证基本安全；
2. **API token 自动创建**：连接成功之后，PDM 会自动创建一个 API token 用来跟 PVE 远程节点通信，不用自己手工配。

向导走完，就能在远程面板里做概览和基本管理了。

## 路线图：什么时候能用上正式版？

- Alpha 阶段持续到 **2025 年上半年**，之后出第一个 Beta；
- 第二个 Beta 会基于即将到来的 Debian Trixie；
- **2025 年晚些时候**计划推出 1.0 稳定版。

## 一点期待

对 homelab 玩家来说，机器多了之后最烦的就是管理面碎片化：这台装 PVE、那台装别的，每台一个网页，看状态全靠挨个刷。PDM 这种"一个面板看所有"的思路如果真能落地，再配合免集群网络的迁移能力，折腾成本能降一大截。Rust 全栈这个选择也让人安心——性能和安全底子在那摆着。先记下安装方法，等 Beta 出来再上车，Alpha 就不折腾生产环境了。
