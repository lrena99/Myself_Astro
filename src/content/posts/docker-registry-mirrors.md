---
title: "Docker 镜像拉不动？这份加速源清单我攒了好几年"
published: 2025-02-23
description: "Docker Hub 动不动就拉不动，这些年我攒了一批还能用的镜像加速源，daocloud、ustc、azure、timeweb、网友自建的，全给你列出来，写进 registry-mirrors 就能救急。注意：第三方源不保证安全。"
tags: ["Docker", "镜像加速", "容器"]
category: "技术"
draft: false
image: "/images/covers/wall-13.webp"
---

Docker Hub 在国内的访问情况大家都懂，镜像拉不动是常态：`docker pull` 卡在 `waiting` 半天不动，或者报 `timeout`、报 `TLS handshake timeout`，血压直接拉满。好消息是这事有解——镜像加速源，相当于给 Docker 请了个"代购"：你把想要的镜像名告诉它，它帮你从 Docker Hub 搬回来，速度嗖嗖的。

这些年我攒了一批实测还能用的加速源，按场景分了三类，直接抄。**提前声明：镜像源会随时失效，今天能用不代表明天能用，多攒几个备胎总是没错的。**

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

配置完 `systemctl restart docker` 生效。改文件前建议先 `cp daemon.json daemon.json.bak` 备份一下，万一 JSON 格式写错（比如漏了逗号），还能秒回滚。想确认生效没有，跑一句 `docker info`，看 `Registry Mirrors` 那一栏，列表在里面就是加载成功了；再随便 `docker pull` 个常用镜像试试速度，通的就是好的。

几个源简单介绍下：`mirrors.ustc.edu.cn` 是中科大的，老牌教育网源，口碑一直稳；`mirror.azure.cn` 是微软 Azure 中国的源，也相当能打；`docker.m.daocloud.io` 是 DaoCloud 的，社区常用；剩下的 noohub、huecker、timeweb 这些是海外的公开镜像站，作为补充梯队很好用。多放几个在数组里，Docker 拉镜像时会按顺序挨个试，一个挂了自动换下一个，等于给 pull 上了双保险。

对了，像华为云、阿里云那种个人专属加速地址（一串个人账号 ID 前缀那种）我特意没贴：那是绑着个人账号的，你复制过去根本用不了，还容易泄露账号信息。想要的话去各家云厂商控制台自己领一个，都是免费的，额度也够个人用。

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

1Panel 是个开源的面板，能在网页上点鼠标管理 Docker，对不喜欢敲命令的人很友好。面板设置里有镜像加速的配置入口，把这份清单粘进去保存就行。跟命令行版互为补充：命令行装的话用上面那份，面板管理的话用这份，两条腿走路。清单里还多了清华 tuna、opencas 这几个源，都是国内高校和科研机构维护的，稳定性不错，也可以反过来抄进 daemon.json 用。

## 网友自建的源（谨慎使用）

网上还流传着一批个人自建的加速镜像，有些确实是热心网友在维护：

```
https://docker.agsv.top
https://docker.agsvpt.work
https://docker.laotie666.link
https://docker.kame.gay
https://hub.docker-ttc.xyz
```

**第三方镜像源不能保证安全**，拉下来的镜像记得验一下签名，生产环境慎用。这话我要多说一遍：个人维护的源，稳定性看心情，安全性看人品，图个应急可以，别当长期饭票。

## 报错自查：拉不动时先对号入座

镜像拉不动的时候，先别急着换源，看看报错属于哪种：

- `timeout` / `i/o timeout`：网络根本够不到目标，多半是源挂了或者网络被限制，直接换下一个。
- `TLS handshake timeout`：握手超时，源不稳定的典型症状，换。
- `manifest unknown` / `not found`：镜像名写错了，或者这个源还没同步这个镜像，换个源试试。
- `unauthorized`：私有镜像需要登录，先 `docker login` 再说。

对号入座之后再动配置，能少走不少弯路。

## 另一个思路：不用 Docker 也能拉镜像

如果只是想下载某个镜像而不装 Docker，可以用 [dockerc](https://github.com/NilsIrl/dockerc) 这个工具做二进制部署，绕开 Docker 守护进程，也算一条备选路线。适合那种"我只要这一个镜像跑起来，不想装一整套 Docker"的场景，轻装上阵，系统里少个守护进程也少个攻击面。

## 最后的唠叨

镜像加速源这份清单，本质上是"打游击"：官方直连不行就找代购，代购不行就换一家。我自己的习惯是：**配置里常驻五六个源，隔一阵子就 `docker pull` 个常用镜像试试水，挂了的及时换掉。** 第三方源不保证安全这条，永远记在心里。

希望这份清单能帮你少掉几根头发。镜像拉不动的日子，总会过去的。
