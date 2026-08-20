---
title: "WireGuard 虚拟局域网完整教程：手动安装 + Docker 两条路线"
published: 2024-12-22
description: "想把几台机器组进一个虚拟局域网？WireGuard 比传统 VPN 轻快得多。这篇记录手动安装、生成密钥、配服务端和客户端、加节点，还有 Docker 一键部署 wg-easy 的完整命令，照着抄就完事。"
tags: ["WireGuard", "VPN", "虚拟局域网", "Docker"]
category: "技术"
draft: false
image: "/images/covers/wall-36.webp"
---

把分散的机器组进同一个虚拟局域网，WireGuard 是我用过最轻快的方案，配置也直白。这篇是我折腾时的完整记录，参考了 gitee 上的 [spoto/wireguard 教程](https://gitee.com/spoto/wireguard)，手动安装和 Docker 两条路线都有。**文中所有 IP、网段、密钥都是示例值，实际部署时以你自己生成的密钥和规划的网段为准。**

## 手动安装 WireGuard（以 Debian/Ubuntu 为基础）

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

IP 转发不开的话，客户端之间、客户端和外部网络之间都没法转发流量，这一步别漏。

### 进入配置目录，调整权限

```bash
cd /etc/wireguard/
chmod 0777 /etc/wireguard

# 调整目录默认权限，防止密钥文件权限过宽
umask 077
```

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

追加完记得 `wg-quick down wg0 && wg-quick up wg0` 让配置生效。

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

启动后浏览器打开 `http://服务器地址:51821` 就是容器管理界面，登录密码就是上面 `PASSWORD` 设的那个。

更新容器：

```bash
docker stop wg-easy
docker rm wg-easy
docker pull weejewel/wg-easy
```

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

`PersistentKeepalive` 建议加上，NAT 后面的客户端靠它维持和服务器的心跳，不然长时间没流量可能连不上。整个流程跑通之后，几台机器就像在同一个局域网里一样，互相访问直接用虚拟 IP 就行。
