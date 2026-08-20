---
title: "我压箱底的 .vimrc：带注释的完整配置，直接抄"
published: 2025-09-06
description: "一份注释比代码还多的 .vimrc 长啥样？行号、状态栏、搜索高亮、括号自动补全、新建文件自动插文件头……每个配置都标了作用，新手也能看懂。抄走微调就能用，从此告别默认 vim。"
tags: ["vim", "vimrc", "编辑器"]
category: "技术"
draft: false
image: "/images/covers/wall-34.webp"
---

这份 `.vimrc` 是我一直在用的配置，放在 `~/.vimrc` 下。从基本环境、界面显示到编码、搜索、缩进、快捷键和新建文件自动模板都有，而且每行都写了注释，新手也能看懂每一句是干嘛的。分享出来，需要的直接抄。

## 基本环境与界面

```vim
"--------------------  基本环境  --------------------
set nocompatible            " 去掉 VI 兼容模式
filetype on                 " 侦测文件类型
filetype plugin on          " 加载文件类型插件
filetype indent on          " 加载对应缩进规则

"--------------------  显示与界面  --------------------
set number                  " 行号
set ruler                   " 状态栏显示当前行列
set laststatus=2            " 总是显示状态栏
set cmdheight=2             " 命令行高度
set cursorline              " 高亮当前行
set showmatch               " 括号匹配高亮
set matchtime=1             " 匹配高亮时长（0.1s）
set scrolloff=3             " 光标上下保留 3 行
set report=0                " 任何修改都给出提示
set fillchars=vert:\        " 垂直分隔符用空格
set whichwrap+=<,>,h,l      " 左右箭头可换行
set backspace=2             " 退格键跨行/缩进可用
set mouse=a                 " 各模式下启用鼠标
set selection=exclusive
set selectmode=mouse,key
```

## 编码、搜索与编辑行为

```vim
"--------------------  编码与字符  --------------------
set encoding=utf-8
set fileencodings=utf-8,ucs-bom,gb18030,gbk,gb2312,cp936
set langmenu=zh_CN.UTF-8
set helplang=cn

"--------------------  搜索  --------------------
set ignorecase              " 搜索忽略大小写
set smartcase               " 有大写字母时区分大小写
set hlsearch                " 高亮搜索结果
set incsearch               " 实时增量搜索
set gdefault                " 默认全局替换（:%s///g）

"--------------------  编辑行为  --------------------
set autoindent              " 继承上一行缩进
set smartindent             " 智能缩进（C/C++ 等）
set cindent                 " C 风格缩进
set tabstop=4               " 一个 <Tab> 显示宽度
set shiftwidth=4            " 自动缩进宽度
set softtabstop=4           " 退格/插入时 Tab 宽度
set noexpandtab             " 不用空格替换 Tab
set smarttab                " 行首按 Tab 插入 shiftwidth
set completeopt=longest,menu " 内置补全策略
set clipboard=unnamed       " 共享系统剪贴板（* 寄存器）
set nobackup                " 不保留备份文件
set noswapfile              " 不生成交换文件
set autoread                " 文件外部修改后自动载入
set autowrite               " 切换文件前自动保存
set history=1000            " 命令历史条数
set wildmenu                " 命令行补全增强
set iskeyword+=_,$,@,%,#,- " 这些字符也算单词一部分
```

几个我离不开的：`set clipboard=unnamed` 让 vim 直接共享系统剪贴板，复制粘贴不再别扭；`set cursorline` 高亮当前行，长文件里定位不花眼；`fileencodings` 里带上 gb18030，打开老编码的文件不乱码。

## 快捷键与新建文件模板

```vim
"--------------------  状态栏自定义  --------------------
" set statusline=%F%m%r%h%w\ [FORMAT=%{&ff}]\ [TYPE=%Y]\ [POS=%l,%v][%p%%]\ %{strftime(\"%d/%m/%y\ -\ %H:%M\")}

"--------------------  快捷键  --------------------
nnoremap <leader>w :w!<CR>
nnoremap <leader>f :find<CR>
" 全选+复制
map  <C-A> ggVGY
map! <C-A> <Esc>ggVGY
" F12 格式化整个文件（gg=G）
map <F12> gg=G

"--------------------  新建文件模板  --------------------
" 新建 .c/.h/.sh/.java 时自动插入文件头
autocmd BufNewFile *.cpp,*.[ch],*.sh,*.java exec ":call SetTitle()"
func SetTitle()
    if &filetype == 'sh'
        call setline(1, "##########################################################################")
        call append(line("."), "# File Name: ".expand("%"))
        call append(line(".")+1, "# Created Time: ".strftime("%c"))
        call append(line(".")+2, "#########################################################################")
        call append(line(".")+3, "#!/bin/zsh")
        call append(line(".")+4, "")
    else
        call setline(1, "/*************************************************************************")
        call append(line("."), "        > File Name: ".expand("%"))
        call append(line(".")+1, "      > Created Time: ".strftime("%c"))
        call append(line(".")+2, " ************************************************************************/")
        call append(line(".")+3, "")
    endif
    if &filetype == 'cpp'
        call append(line(".")+4, "#include<iostream>")
        call append(line(".")+5, "using namespace std;")
        call append(line(".")+6, "")
    endif
    if &filetype == 'c'
        call append(line(".")+4, "#include<stdio.h>")
        call append(line(".")+5, "")
    endif
    " 新建文件后定位到末尾
    autocmd BufNewFile * normal G
endfunc
```

模板部分挺实用的：新建 `.c/.h/.sh/.java` 文件时自动生成文件头注释，C/C++ 还会顺手补上 `#include`，新建完自动跳到文件末尾。原模板里的作者和邮箱信息我删掉了，抄的时候换成自己的就行。

## 括号自动补全（原生实现，不用插件）

```vim
"--------------------  括号自动补全（原生实现）  --------------------
inoremap ( ()<Esc>i
inoremap [ []<Esc>i
inoremap " ""<Esc>i
inoremap ' ''<Esc>i
inoremap ) <C-R>=ClosePair(')')<CR>
inoremap ] <C-R>=ClosePair(']')<CR>
func! ClosePair(char)
    if getline('.')[col('.') - 1] == a:char
        return "\<Right>"
    else
        return a:char
    endif
endfunc
```

这段用原生 vimscript 实现了括号自动补全：输入左括号自动补右括号，光标停在中间；输入右括号时如果后面已经有配对的，就直接跳过而不是重复插入。不依赖任何插件，轻量够用。

整套配置零插件、纯 vimscript，适合想要一个顺手编辑器又不想折腾插件管理的场景。抄完记得 `source ~/.vimrc` 或者重开 vim 生效。
