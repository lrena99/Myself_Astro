---
title: "Debian 下 vi 方向键失灵？两行配置，30 秒搞定"
published: 2025-03-10
description: "在 Debian 里用 vi 编辑文件，方向键变成 ABCD、退格键还删不了字？别急着换编辑器，这只是 vi 的兼容模式在作怪。改两行配置就能恢复，亲测有效，附完整操作步骤。"
tags: ["vi", "Debian", "Linux"]
category: "技术"
draft: false
image: "/images/covers/wall-11.webp"
---

用 Debian 的时候发现一个很烦人的问题：vi 进入插入模式后，方向键不听话了——按上下左右，屏幕上冒出来的却是 A/B/C/D 这样的字符，退格键也删不掉东西。

一开始以为是自己手残按错了，试了几次才发现是配置问题。查了一圈，原因其实很简单：Debian 的 vi 默认跑在兼容模式下，方向键和退格键的行为就变得不正常了。

## 解决方法

编辑 `/etc/vim/vimrc.tiny`，加上两行配置：

```
set nocompatible
set backspace=2
```

- `set nocompatible`：让 vim 退出兼容模式，方向键恢复正常
- `set backspace=2`：允许退格键跨行、跨缩进删除，退格键也活了

保存退出，重新打开 vi 试试，方向键和退格键都正常了。

## 小结

- 出问题的是 vi 的兼容模式，不是你的操作
- 核心配置就两行：`set nocompatible` + `set backspace=2`
- 改的是 `/etc/vim/vimrc.tiny`，对系统里的 vi 调用都生效

如果你也遇到过 vi 方向键乱码的问题，试试这两行，基本一次搞定。
