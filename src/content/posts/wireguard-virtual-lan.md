---
title: "WireGuard 虚拟局域网完整教程：手动安装 + Docker 两条路线"
published: 2024-12-22
description: "想把几台机器组进一个虚拟局域网？WireGuard 比传统 VPN 轻快得多。这篇记录手动安装、生成密钥、配服务端和客户端、加节点，还有 Docker 一键部署 wg-easy 的完整命令，照着抄就完事。"
tags: ["WireGuard", "VPN", "虚拟局域网", "Docker"]
category: "技术"
draft: false
image: "/images/covers/wall-36.webp"
---

把分散在各地的几台机器组进同一个虚拟局域网，互相访问像坐在同一间机房里一样，这是我折腾网络时最想要的效果。试过不少方案，WireGuard 是让我最惊喜的一个：跑在内核里、配置极简、速度也漂亮，用一次就回不去了。

这篇是我折腾时的完整记录，参考了 gitee 上的 [spoto/wireguard 教程](https://gitee.com/spoto/wireguard)，手动安装和 Docker 两条路线都有，照着抄基本就完事。**注意：文中所有 IP、网段、密钥都是示例值，实际部署时以你自己生成的密钥和规划的网段为准，千万别把示例当成现成的来用。**

## WireGuard 是啥，为什么选它

一句话：WireGuard 是一个基于内核的现代 VPN 协议，把加密隧道这件事做得又轻又快。跟 OpenVPN 那种老前辈比，它没有一堆证书和复杂配置，一个接口、一对密钥就能开张。配置简单、性能好、代码量也小，审计起来放心，所以我组虚拟局域网第一个想到的就是它。用途也广：异地组网、手机回家里网络、几台服务器互通，都能用。

## 手动安装 WireGuard（以 Debian/Ubuntu 为基础）

手动装的思路其实很简单：装软件 → 开转发 → 生成密钥 → 写配置 → 启动，一共五步，下面一步步来。

### 安装软件并开启 IP 转发

先切到 root，然后安装 wireguard 和 resolvconf：

```bash
sudo -i

# 安装 wireguard 软件
apt install wireguard resolvconf -y

# 开启 IP 转发
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p
```

IP 转发不开的话，客户端之间、客户端和外部网络之间都没法转发流量，这一步别漏。可以这么理解：服务器要当"包快递员"，得先跟内核说好"允许转寄包裹"，不然流量送到门口就被拦下了。resolvconf 是管 DNS 解析的小工具，顺手装上，省得客户端解析域名时闹脾气。

### 进入配置目录，调整权限

```bash
cd /etc/wireguard/
chmod 0777 /etc/wireguard

# 调整目录默认权限，防止密钥文件权限过宽
umask 077
```

密钥这东西最怕权限太宽被围观。`chmod 0777` 是把目录暂时放宽，方便后面写配置；`umask 077` 则是让新建的文件默认只有自己能读写，一松一紧配合好，权限就不会裸奔。

### 生成服务器密钥

```bash
# 生成私钥
wg genkey > server.key

# 通过私钥生成公钥
wg pubkey < server.key > server.key.pub
```

### 生成客户端密钥

```bash
# 生成私钥
wg genkey > client1.key

# 通过私钥生成公钥
wg pubkey < client1.key > client1.key.pub
```

密钥生成完可以这样查看（实际部署时注意保管好私钥，别泄露）：

```bash
cat server.key && cat server.key.pub && cat client1.key && cat client1.key.pub
```

私钥是"家门钥匙"，公钥是"锁芯"：别人拿到你的公钥没卵用，但私钥一旦泄露，虚拟局域网等于裸奔。所以平时别把私钥贴进聊天记录、仓库或者博客里，我这篇里也全是占位符，部署时一定用自己生成的那份。

### 自动创建服务器配置文件

```bash
echo "
[Interface]
PrivateKey = $(cat server.key) # 填本机的 privatekey 内容
Address = 10.0.0.1 # 本机虚拟局域网 IP（示例网段，按自己规划改）

PostUp   = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
# 注意 eth0 需要改成自己机器的网卡名称

ListenPort = 50814 # 监听端口
DNS = 8.8.8.8
MTU = 1420
[Peer]
PublicKey = $(cat client1.key.pub) # 自动填入 client1 的公钥
AllowedIPs = 10.0.0.10/32 # 客户端所使用的 IP（示例）" > wg0.conf
```

这段脚本用 `$(cat ...)` 把刚生成的密钥自动填进配置，省得手抄出错。几个要点拆开讲：

- `Address`：服务器在虚拟局域网里的身份证，自己规划一个网段，别跟家里路由器网段撞车。
- `PostUp / PostDown`：启动和关闭时自动配 iptables 规则做 NAT 转发，让客户端能借服务器的"腿"上网。`eth0` 一定记得改成你机器真实的网卡名，不然规则加不进去。
- `ListenPort`：服务器对外监听的 UDP 端口，记好它，客户端连接全靠这个口。
- `AllowedIPs`：这个 peer 被允许使用的虚拟 IP，一对一锁死，谁也别想冒名顶替。

### 设置开机自启并启动

```bash
systemctl enable wg-quick@wg0
```

```bash
# 启动 wg0
wg-quick up wg0
# 关闭 wg0
wg-quick down wg0
```

如果不想用自动生成的方式，也可以手动编辑配置文件：

```bash
nano /etc/wireguard/wg0.conf
```

### 客户端配置（以 client1 为例）

客户端从 [wireguard.com/install](https://www.wireguard.com/install/) 下载安装，然后新建一个配置：

```ini
[Interface]
PrivateKey = 这里填 client1 的私钥
Address = 10.0.0.10 # 此处为 peer 规定的客户端 IP（示例）
MTU = 1500

[Peer]
PublicKey = 这里填服务器的公钥
AllowedIPs = 10.0.0.0/24 # 允许访问的虚拟局域网网段（示例）
Endpoint = 服务器公网IP:50814
```

注意客户端和服务器的配置是"配对"的：服务器里登记的 peer 公钥要对应客户端的私钥，客户端里填的服务器公钥要对应服务器的私钥，两边对不上就握手失败。`Endpoint` 填服务器公网 IP 加监听端口，服务器 IP 变了记得同步更新。

### 增加客户端节点 client2

再要加一台机器，同样先生成密钥，然后把新 peer 追加进服务器配置：

```bash
# 生成私钥
wg genkey > client2.key

# 通过私钥生成公钥
wg pubkey < client2.key > client2.key.pub

# 将 peer 公钥加入 wg0.conf 配置
echo "
[Peer]
PublicKey = $(cat client2.key.pub) # 自动填入 client2 的公钥
AllowedIPs = 10.0.0.11/32 # 客户端 Client2 所使用的 IP（示例）" >> wg0.conf
```

追加完记得 `wg-quick down wg0 && wg-quick up wg0` 让配置生效。加节点就像往通讯录里塞新联系人，塞完重启一下服务，两边就认识了。

## Docker 安装 WireGuard（wg-easy）

不想手动折腾的话，用容器跑 [wg-easy](https://github.com/wg-easy/wg-easy) 最省事，带 Web 管理界面，加客户端点两下就行：

```bash
docker run -d \
  --name=wg-easy \
  -e WG_HOST=服务器公网IP \
  -e PASSWORD=自己设一个管理密码 \
  -e WG_DEFAULT_ADDRESS=10.0.0.x （默认虚拟局域网 IP 段，示例）\
  -e WG_DEFAULT_DNS=114.114.114.114 （默认 DNS）\
  -e WG_ALLOWED_IPS=10.0.0.0/24 （允许连接的 IP 段，示例）\
  -e WG_PERSISTENT_KEEPALIVE=25 （重连间隔）\
  -v ~/.wg-easy:/etc/wireguard \
  -p 51820:51820/udp \
  -p 51821:51821/tcp \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_MODULE \
  --sysctl="net.ipv4.conf.all.src_valid_mark=1" \
  --sysctl="net.ipv4.ip_forward=1" \
  --restart unless-stopped \
  weejewel/wg-easy
```

几个环境变量说一下：`WG_HOST` 必须填服务器公网 IP，不然客户端生成的配置里 Endpoint 是空的；`PASSWORD` 是管理界面登录密码，别设成 123456 这种；`WG_DEFAULT_ADDRESS` 是默认分给客户端的 IP 段；`WG_ALLOWED_IPS` 是允许连接的网段；`WG_PERSISTENT_KEEPALIVE` 是 NAT 后面的客户端保持心跳的重连间隔。端口方面，51820/udp 是 WireGuard 隧道，51821/tcp 是网页管理界面。

启动后浏览器打开 `http://服务器地址:51821` 就是容器管理界面，登录密码就是上面 `PASSWORD` 设的那个。新客户端在网页上点一下就能生成二维码和配置文件，手机扫一扫就入网，体验比手动折腾顺滑太多。

更新容器：

```bash
docker stop wg-easy
docker rm wg-easy
docker pull weejewel/wg-easy
```

更新流程就是"先停、再删、拉新镜像、重新跑"，三步走完新版本就位。

## 自建：客户端配置文件示例

![WireGuard 配置截图](/images/posts/wireguard-virtual-lan/01.webp)

我自建时用的客户端配置长这样，`AllowedIPs = 0.0.0.0/0, ::/0` 表示全部流量都走 VPN（全局代理模式）：

```ini
[Interface]
Address = 10.0.0.2/24 # 示例：客户端虚拟 IP
DNS = 8.8.8.8, 8.8.4.4
PrivateKey = （你自己的私钥）

[Peer]
PublicKey = （服务器的公钥）
PresharedKey = （预共享密钥，可选）
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = 服务器公网IP:51820
PersistentKeepalive = 25
```

`PersistentKeepalive` 建议加上，NAT 后面的客户端靠它维持和服务器的心跳，不然长时间没流量可能连不上。`PresharedKey` 是可选的双保险，两边配上同一个值就行，配了更安心。注意自建这条路监听的是 51820 端口，跟 wg-easy 的默认一致，客户端 Endpoint 里要写对。

## 常见坑位提醒

最后把常见坑集中说一遍，都是血泪经验换来的：

- **防火墙要放行 UDP 端口**：服务器上的 `ListenPort`（比如 50814）走的是 UDP 协议，云服务器的安全组、本机的 ufw/iptables 都得放行，不然客户端永远握手失败，还一脸懵。
- **密钥必须配对**：客户端私钥 ↔ 服务器上登记的该客户端公钥、客户端里填的服务器公钥 ↔ 服务器私钥，任一对不上就握手失败。排查时可以用 `wg show` 看握手时间，一直没握手就是配对或端口的问题。
- **Endpoint 别写死**：服务器公网 IP 变了，客户端配置里的 Endpoint 要跟着改，不然客户端还傻乎乎地往老地址发心跳。
- **私钥是命根子**：私钥泄露 = 虚拟局域网裸奔，赶紧重新生成密钥整体换一遍。

工具是死的，人是活的，照着配一遍、把原理记在心里，以后加节点就是几分钟的事。整个流程跑通之后，几台机器就像在同一个局域网里一样，互相访问直接用虚拟 IP 就行。组网这件事，WireGuard 真的是我用过最省心的打开方式。
