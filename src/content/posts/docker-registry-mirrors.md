---
title: "Docker 镜像拉不动？这份加速源清单我攒了好几年"
published: 2025-02-23
description: "Docker Hub 动不动就拉不动，这些年我攒了一批还能用的镜像加速源，daocloud、ustc、azure、timeweb、网友自建的，全给你列出来，写进 registry-mirrors 就能救急。注意：第三方源不保证安全。"
tags: ["Docker", "镜像加速", "容器"]
category: "技术"
draft: false
---

Docker Hub 在国内的访问情况大家都懂，镜像拉不动是常态。这些年我攒了一批实测还能用的加速源，按场景分了三类，直接抄。

## 我的 registry-mirrors 配置

`/etc/docker/daemon.json` 里这样写：

```json
{
  "registry-mirrors": [
    "https://noohub.ru",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://docker.1panel.live",
    "http://mirrors.ustc.edu.cn",
    "http://mirror.azure.cn",
    "https://docker.ckyl.me",
    "https://docker.chenby.cn",
    "https://docker.hpcloud.cloud",
    "https://docker.m.daocloud.io"
  ]
}
```

配置完 `systemctl restart docker` 生效。多放几个，一个挂了还有备胎。

## 1Panel 面板用的清单

用 1Panel 管理 Docker 的话，面板里也可以配一套：

```
https://docker.1panelproxy.com
https://huecker.io
https://noohub.ru
http://mirrors.ustc.edu.cn
https://dockerhub.timeweb.cloud
https://docker.chenby.cn
https://dockerhub-mirror-cn.huaweicloud.com
https://docker.tuna.tsinghua.edu.cn
https://docker.mirrors.opencas.cn
https://docker.hlmirror.com
```

## 网友自建的源（谨慎使用）

网上还流传着一批个人自建的加速镜像，有些确实是热心网友在维护：

```
https://docker.agsv.top
https://docker.agsvpt.work
https://docker.laotie666.link
https://docker.kame.gay
https://hub.docker-ttc.xyz
```

**第三方镜像源不能保证安全**，拉下来的镜像记得验一下签名，生产环境慎用。

## 另一个思路：不用 Docker 也能拉镜像

如果只是想下载某个镜像而不装 Docker，可以用 [dockerc](https://github.com/NilsIrl/dockerc) 这个工具做二进制部署，绕开 Docker 守护进程，也算一条备选路线。

最后提醒一句：这些加速源会随时失效，今天能用不代表明天能用，平时多攒几个备胎总是没错的。
