---
title: "Tailscale 卡成 1000ms？我自建了 Headscale + DERP 中继，两天踩坑实录"
published: 2024-12-18
description: "官方 DERP 中继在国内 ping 上千毫秒，忍不了。于是我把 Tailscale 控制面换成自建 Headscale，再自建 DERP 中继：root 启动报错、纯 IP 部署 derper 必须和 headscale 分开……两个下午的坑位，都给你标好了。"
tags: ["Tailscale", "Headscale", "DERP", "内网穿透", "自建服务"]
category: "折腾"
draft: false
image: "/images/covers/wall-41.webp"
---

Tailscale 是个好东西，但官方中继在国内就是个笑话——ping 测试随便上千毫秒，卡得怀疑人生。所以我干脆把控制面换成自建的 Headscale，再自建一个 DERP 中继，把网络控制权完全拿回自己手里。这篇是我完整折腾记录整理出来的教程，坑都帮你们标好了。

## 为什么我要自建：官方中继在国内真的顶不住

先说结论：**自建的核心就两件事——Headscale 控制面 + DERP 中继**。Tailscale 本身用起来很爽，但它的控制服务器（负责认证、密钥管理）是闭源的，而且国内没有官方 DERP 中继节点。不想经过 Tailscale 官方那层审计、又嫌中继卡的人，自建是唯一出路。

![自建 Headscale + DERP 的网络拓扑（笔记配图）](/images/posts/headscale-derp-selfhost-guide/01.webp)

## 先搞懂这几样东西

先说清楚三者的分工，对比表一目了然：

![三种方案的对比（笔记配图）](/images/posts/headscale-derp-selfhost-guide/02.webp)

### Tailscale：装个客户端就能用的 WireGuard 组网

Tailscale 是基于 WireGuard 的虚拟组网工具，相比自己手搓 WireGuard，优势非常明显：

- 装个客户端就能用，不用配防火墙，没有额外配置
- 高安全性：自动密钥轮换、点对点连接、支持审查端到端访问记录
- 在 ICE、STUN 等 UDP 协议之外，实现了 DERP TCP 协议来做 NAT 穿透

当然也有缺点：相比内核态 WireGuard 性能有损失；免费账户只带 100 个设备（个人用完全够了）；而且控制服务没开源。这就是自建 Headscale 的理由。

### Headscale：把控制权拿回自己手里

Headscale 是 Juan Font 用 Go 写的开源项目（BSD 许可），实现了 Tailscale 控制服务器的所有主要功能：创建和管理虚拟网络、设备安全通信、不限设备数量、所有流量由你自己控制不经过第三方。适合企业内部网络、私有云，或者任何不想让流量过第三方的情况。

### DERP：连接协调 + 保底中继

DERP（Detoured Encrypted Routing Protocol）是 Tailscale 自研的协议：

- 它是一个通用目的包中继协议，**运行在 HTTP 之上**，大部分网络都允许 HTTP 通信
- 根据目的公钥（destination's public key）来中继加密流量
- 功能：帮助设备发现彼此并协调连接、支持 NAT 穿透、直连失败时转发流量、去中心化无单一控制点

Tailscale 的连接算法很有意思：**所有客户端之间的连接都是先选 DERP 模式（中继）**，这是优先级最低但 100% 能成功的模式，所以连接立即就能建立，用户不用等待。然后客户端并行做路径发现，通常几秒钟后就能发现更优路径，把现有连接透明升级成点对点直连。

所以 DERP 既是 NAT 穿透失败时的保底通信方式（角色类似 TURN），也是帮助我们完成打洞升级的旁路信道。

在动手之前，先补一下 STUN、TURN、DERP 这几个概念——搞懂它们，后面排障心里就有底了：

![STUN/TURN/DERP 概念总览（笔记配图）](/images/posts/headscale-derp-selfhost-guide/03.webp)

### STUN：打洞是怎么实现的

STUN（Session Traversal Utilities for NAT）解决 NAT 穿透问题，主要功能：

- **NAT 类型发现**：识别设备背后的 NAT 类型（完全锥形、受限锥形、端口受限锥形、对称 NAT）
- **公网 IP 和端口发现**：让设备知道自己在公网上的 IP 和端口
- **连接测试**：测试两台设备能否直连，不能就走 DERP 中继

工作原理分两阶段：

1. **NAT 探测**：客户端向 STUN 服务器发 Binding Request，服务器把接收到的源 IP 和端口（也就是客户端的公网地址）封装在 Binding Response 里返回。客户端对比自己的本地地址和公网地址，不一致就说明前面有 NAT 设备。
2. **打洞**：确定各自的公网 IP 和端口后，客户端之间就可以尝试直接建立连接，实现 P2P。

### 网络拓扑（文字版）

直接看图更直观：

![网络拓扑示意图（笔记配图，IP 为示例地址）](/images/posts/headscale-derp-selfhost-guide/04.webp)

拓扑其实很简单，三层：

- **Headscale 控制面服务器**（公网）：负责认证、下发配置、分配 100.64.0.0/10 网段的虚拟 IP
- **DERP 中继服务器**（公网，含 STUN 服务）：连接协调 + 直连失败时中继流量
- **各客户端**（各自 NAT 后面）：接入后先走 DERP 建立连接，几秒内尝试升级为 P2P 直连

## Headscale 部署（二进制方案）

我用的 Debian 服务器，版本以官网 2024/8/7 的 release `0.22.3` 为准。官方推荐的一键安装方式（`.dev` 方式）在我环境里有个坑：后续启动 headscale 时起不来，所以我改用了二进制安装。

### 下载二进制和配置文件

```bash
# 下载需要魔法 自行解决
wget -O /usr/local/bin/headscale https://github.com/juanfont/headscale/releases/download/v0.22.3/headscale_0.22.3_linux_amd64

# 简单声明下为什么要 a all_user 只是偷个懒 因为启动的时候不以root权限执行
chmod a+x /usr/local/bin/headscale

# 用来存放headscale的配置文件，以及后续自建derp也放这里(derp没说必须放这里 只是放一起好找)
mkdir /etc/headscale/
# 用于存放 Headscale 服务运行时需要的临时文件，如 UNIX 域套接字文件 headscale.sock
mkdir -p /var/run/headscale/

# 下载二进制同版本的示例配置文件
wget -O /etc/headscale/config.yaml https://raw.githubusercontent.com/juanfont/headscale/v0.22.3/config-example.yaml
```

### 创建 headscale 专用用户（别用 root！）

这里有个**大坑**：我直接用 root 启动，各种报错，哪怕改了 systemd 里的 `User` 也还是报错。Headscale 本身只是取代 Tailscale 的**控制中心**，不需要 root 权限。建议专门建一个 `headscale` 用户来跑：

```bash
useradd \
  --create-home \          # 主目录不存在则创建
  --home-dir /var/lib/headscale/ \
  --system \               # 创建系统账户
  --user-group \           # 创建同名用户组
  --shell /usr/sbin/nologin \
  headscale
```

创建空的 SQLite 数据库文件和 derp 配置文件，并给 `headscale` 用户对应权限：

```bash
touch /var/lib/headscale/db.sqlite /etc/headscale/derp.yaml
chown -R headscale:headscale /var/run/headscale/ /var/lib/headscale
chmod a+r /etc/headscale/config.yaml /etc/headscale/derp.yaml
```

### systemd 服务

创建 `/etc/systemd/system/headscale.service`：

```bash
cat > /etc/systemd/system/headscale.service << EOF
[Unit]
Description=headscale controller
After=syslog.target
After=network.target

[Service]
Type=simple
User=headscale
Group=headscale
ExecStart=/usr/local/bin/headscale serve
Restart=always
RestartSec=5

# Optional security enhancements
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
WorkingDirectory=/var/lib/headscale
ReadWritePaths=/var/lib/headscale /var/run/headscale
AmbientCapabilities=CAP_NET_BIND_SERVICE
RuntimeDirectory=headscale

[Install]
WantedBy=multi-user.target
EOF
```

### 配置文件要点

修改 `/etc/headscale/config.yaml`，只需改这几处：

```yaml
server_url: http://headscale.example.com:8080   # 替换成你的公网ip或ddns域名

# 0.0.0.0才能监听到  当然可以用公网ip  或者网卡的ip
listen_addr: 0.0.0.0:8080

# ip段范围（我用不到v6 所以注释）
ip_prefixes:
  # - fd7a:115c:a1e0::/48
  - 100.64.0.0/10

dns_config:
  # 改为 false 不覆盖本地 DNS
  override_local_dns: false
  # 关闭 magic_dns
  magic_dns: false
  # 设置为你自己的标识，否则客户端连接上显示是 user@example.com
  base_domain: example.com
# 随机端口要打开，tailscale 客户端会使用41641 端口建立 wireguard 链接，这个端口会被中间网络设备阻止
randomize_client_port: true
```

### 启动与验证

```bash
# 测试配置文件 看看输出是否正常
headscale configtest

# 测试启动一次
headscale serve
# 注意：ctrl + c 的时候请耐心等待进程自己结束，不然会出现很奇怪的问题，会导致后续 systemd 启动失败
# 配置文件没问题就 ctrl + c 取消掉，改用 systemd 启动（后台静默运行）

systemctl daemon-reload
systemctl enable --now headscale
systemctl status headscale
```

## 客户端接入

### 创建用户和 pre-authkey

```bash
# default 自己取
headscale user create default

# 生成一个过期时间 365d 且可以重复使用的 authkey（因为我是自用 所以创建天数多点方便）
# 不然正常 24h 就很多了，更安全
headscale preauthkeys --user default create --reusable --expiration 365d

# 查看下创建的 authkey
headscale preauthkeys --user default list
```

### Windows 接入

先说一下 `tailscale up` 的常用通用选项：

- `--login-server`：指定使用的中央服务器地址（必填）
- `--advertise-routes`：向中央服务器报告当前客户端所在的内网网段，便于同内网设备直连或做路由（可选，多条路由英文逗号隔开）
- `--accept-routes`：是否接受中央服务器下发的路由规则（可选）
- `--accept-dns`：是否使用中央服务器下发的 DNS 配置（可选，推荐关闭）
- `--hostname`：设置机器名，否则默认以 hostname 注册；特别是安卓的 hostname 无法修改

执行 `tailscale up` 需要在 Tailscale 的安装目录（比如 `D:\software\Tailscale`）打开 cmd。贴一个自用的命令：

```bash
tailscale up --login-server http://headscale.example.com:8080 --hostname <自己取 需要英文> --accept-routes=true --accept-dns=false --authkey <就是刚刚生成的 authkey>
```

### 常用排障三件套

以下命令同样要在安装目录的 cmd 下执行，不然就得加个 `path` 环境变量：

```bash
# 看 derp 服务用的是哪条/哪些
tailscale netcheck

# 看状态，能看出是打洞成功还是走的 derp 服务
tailscale status

# 用来 ping 测试
tailscale ping <headscale 分配的ip>
```

到这一步，headscale 部署完成，不同客户端也能接入了。但是但是，有个很严重的问题：**Tailscale 和 Headscale 在国内都没有 derp 服务**，而且说句实话，用别人的中继总觉得不安全，ping 测试轻松上千毫秒。所以，需要自建 DERP 中继服务。

## 自建 DERP 中继

### 方案一：域名 + Docker（推荐）

需要满足几个条件：

- 有自己的域名，并且申请了 SSL 证书
- 一台或多台云主机
- 如果服务器在国内，域名需要备案

用 `yangchuansheng` 构建的 docker 镜像部署：

```bash
docker run --restart always \
  --name derper -p 12345:12345 -p 3478:3478/udp \
  -v /root/cert/example.com/:/app/certs \   # 自己申请证书放到目录映射，比如 /root/cert/example.com/
  -e DERP_CERT_MODE=manual \
  -e DERP_ADDR=:12345 \
  -e DERP_DOMAIN=derp.example.com \
  -d ghcr.io/yangchuansheng/derper:latest
```

注意点：

- 默认也会开启 STUN 服务，UDP 端口是 `3478`
- 防火墙需要放行 12345 和 3478
- 证书命名有严格要求：假设域名是 `example.com`，证书必须叫 `example.com.crt`，**一个字符都不能错**！私钥必须叫 `example.com.key`，**一个字符都不能错**！

查看日志确认启动成功：

```bash
docker logs -f derper
2024/08/06 12:50:07 no config path specified; using /var/lib/derper/derper.key
2024/08/06 12:50:07 derper: serving on :12345 with TLS
2024/08/06 12:50:07 running STUN server on [::]:3478
```

然后配置 Headscale 使用自定义 DERP。Headscale 支持两种形式的 DERP 配置：一种是在线 URL（JSON 格式，与 Tailscale 官方格式相同），另一种是本地文件（YAML）。我用本地文件：

```yaml
# /etc/headscale/derp.yaml
regions:
  901:
    regionid: 901
    regioncode: home
    regionname: Home XX
    nodes:
      - name: 901a
        regionid: 901
        hostname: derp.example.com
        ipv4: derp.example.com   # 如果你跟我一样是ddns 那就写ddns的域名就行
        stunport: 3478
        stunonly: false
        derpport: 12345
```

配置说明：

- `regions` 是 YAML 中的**对象**，每个对象表示一个**可用区**，每个可用区可设置多个 DERP 节点（`nodes`）
- 每个可用区的 `regionid` 不能重复，每个 node 的 `name` 不能重复
- `regionname` 一般描述可用区，`regioncode` 一般设成可用区缩写
- `ipv4` 字段不是必须的：域名能公网解析到 DERP 服务器就可以不填；如果用了没在公共 DNS 加解析记录的二级域名，就需要指定 IP（前提是证书包含这个二级域名，搞个泛域名证书就行）
- `stunonly: false` 表示除了 STUN 服务，还可以用 DERP 服务

接着修改 Headscale 配置文件引用上面的自定义 DERP（只贴需要改的地方）：

```yaml
# /etc/headscale/config.yaml
derp:
  server:
    # 不启用官网自带的derp
    enabled: false
  urls:
    # - https://controlplane.tailscale.com/derpmap/default
  paths:
    - /etc/headscale/derp.yaml
```

改完两份配置后重启 headscale（一般重启比较慢，慢慢等就行）：

```bash
systemctl restart headscale
```

之后在客户端执行 `tailscale netcheck` 就能看到自己目前使用的 DERP 服务了：

```shell
tailscale netcheck

Report:
        * UDP: true
        * IPv4: yes, xxxxx:11874
        * IPv6: no, but OS has support
        * MappingVariesByDestIP:
        * PortMapping:
        * Nearest DERP: Home xxx
        * DERP latency:
                - home: 31.8ms  (Home xxx)
```

从官方中继的 1000ms 降到 31.8ms，舒服了。

**重要提醒**：`netcheck` 实际上只检测了 `3478/udp` 端口，就算显示能连，也不代表 12345 端口可以转发流量。最简单的验证办法是直接打开 DERP 服务器的 URL：`https://derp.example.com:12345`，看到页面且地址栏的 SSL 证书标签显示正常可用，那才是真没问题了。

### 方案二：纯 IP 容器（有个天坑）

大部分人都有域名，但都没备案（针对国内服务器），只能用 IP。但是但是但是，使用纯 IP 容器部署有一个**天坑：derper 容器和 headscale 服务不能处于同一台服务器中**，我用了一个下午才踩完这个坑，这点一定要切记！！如果你只有一台公网服务器，那已经可以不用往下看了！！

```bash
docker run --restart always --name derper -d -p 59443:443 -p 3478:3478 -p 3478:3478/udp ghcr.io/yangchuansheng/ip_derper
```

记得放行 `59443` 和 `3478` 两个端口。

Headscale 的本地 YAML 文件不支持纯 IP 这个配置项，只能使用在线 URL 形式（这点我没验证，沿用作者的说法，不想再折腾这个纯 IP 了）。把下面的 JSON 配好：

```json
{
  "Regions": {
    "901": {
      "RegionID": 901,
      "RegionCode": "ali-sh",
      "RegionName": "Aliyun Shanghai",
      "Nodes": [
        {
          "Name": "901a",
          "RegionID": 901,
          "DERPPort": 443,
          "HostName": "192.0.2.1",
          "IPv4": "192.0.2.1",
          "InsecureForTests": true
        }
      ]
    }
  }
}
```

配置说明：

- `HostName` 直接填 derper 的公网 IP，即和 `IPv4` 的值相同
- `InsecureForTests` 一定要设置为 true，以跳过域名验证

然后把这个 JSON 文件变成 Headscale 服务器能访问的 URL，比如在 Headscale 主机上搭个 Nginx，或者上传到对象存储。接着修改 Headscale 配置：

```yaml
# /etc/headscale/config.yaml
derp:
  server:
    # 不启用官网自带的derp
    enabled: false
  urls:
    - https://example.com/derp.json
  paths:
    # - /etc/headscale/derp.yaml
```

改完 `systemctl restart headscale`，验证方式同上。

## 踩坑总结

1. **不要用 root 直接运行 headscale**，否则会有各种奇奇怪怪的问题——这是用一上午踩坑经验换来的
2. **使用纯 IP 一定要把 derper 建在非 headscale 服务所在的服务器上**，否则大大的问题——这是用一下午踩坑经验换来的

## 附：Docker 全家桶方案

![headscale + UI + DERP 三件套架构（笔记配图）](/images/posts/headscale-derp-selfhost-guide/05.webp)

后来我又试了 Docker 全家桶部署（headscale + headscale-ui + derper 三件套），思路是：headscale 容器挂载配置和数据目录，UI 用 `ifargle/headscale-webui` 镜像，derper 还是 `ghcr.io/yangchuansheng/derper`。几个要点：

- 端口规划：headscale 的 HTTP（8080）、metrics（9090）、STUN（3478/udp），UI 的 5000，derper 的 12345 和 3478/udp，全部映射到宿主机，防火墙记得放行
- 多个容器之间建议建一个 docker 网络用容器名互访，UI 和 headscale 域名不同会存在跨域问题，可以用 Nginx 把 `/api/v1/` 反代到 headscale 容器解决
- headscale 容器建议加 `cap_add: NET_ADMIN, SYS_MODULE` 和 `net.ipv4.ip_forward=1`
- UI 的环境变量里 `HS_SERVER`、`DOMAIN_NAME` 换成你的域名，`BASIC_AUTH_USER` / `BASIC_AUTH_PASS` / `KEY` 一定要改成自己的，别用默认值
- 还有一种一键安装脚本的方式，装完直接给 headscale 端口和 `tailscale up --login-server=http://example.com:24112` 的命令，适合图省事

至此，教程结束。希望我的这些坑，能帮大家少走点弯路。
