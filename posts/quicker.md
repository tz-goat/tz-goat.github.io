---
title: "Windows提效-Quicker使用指南"
date: "2026-03-18"
description: "这是我的第2篇博客文章。"
---

## 什么是Quicker

Quicker 是一款 Windows 系统上的启动器软件 ，可通过快捷键启动桌面软件和执行文本指令键入长文本等动作减少重复操作的时间，提升工作效率

> 🔶下载地址：https://getquicker.net/
> 
> **我的推荐码：`1231517-8328`**
> **填写推荐码后，首次购买专业版时，推荐人和被推荐人可同时获赠90天专业版时长**

## 快捷文本指令
支持为常用文本或命令设置缩写，输入缩写即可自动键入全文
- 也可以设置**触发字符**，输入完缩写后，再按下空格/Enter/Shift后再触发
- 3-5个字符是文本指令的最佳长度，方便记忆

### git命令
比如，常用的git命令如`git checkout + 分支`可以通过设置`gco`来快捷输入

| 文本 | 缩写 |
|------|------|
| `git checkout ` | `gco` |
| `git pull origin release/4.2.x; git push` | `gsy` |
| `git pull origin feature/vue3-components` | `gs3` |
| `git add -A\n git commit -m 'feat: ` | `gcf` |
| `git add -A\n git commit -m 'fix: ` | `gcx` |
| `git add -A\n git commit -m 'chore:` | `gcc` |
| `git add -A\n git commit -m 'style:` | `gcs` |
| `; git push` | `gpp ` |

### 常用AI提示词
- 对于较复杂的命令，如果AI没有完全理解任务就进行改动，此时风险很高，引入大量错误的代码，回溯麻烦，浪费token
- 所以避免AI犯傻最有效的方法就是让AI复述一遍它对任务的理解，也方便我们做微调

| 文本 | 缩写 |
|------|------|
| `暂不改动代码，先复述你对这个任务的理解。` | `aii` |

还需要对AI的复述执行回复

| 文本 | 缩写 |
|------|------|
| `理解正确，执行操作` | `ayy` |
| `不对, 我的意思是` | `anono` |

日志在排查问题时是非常关键的，AI IDE不仅需要从日志中获取信息协助排查，同时也擅长加日志来协助

| 文本 | 缩写 |
|------|------|
| `增加简短console帮助我排查` | `addc ` |
| `console.log(` | `clog ` |

### 脚本

| 文本 | 缩写 |
|------|------|
| `pnpm newBranch --new feature/` | `ppnn` |

## 自定义基础动作
可将启动软件、访问网址等操作绑定快捷键，无需打开 Quicker 界面即可快速触发。例如：
- 访问Edge, Chrome浏览器
- 访问Gitlab上个人MR
- 访问Agile Fox

**建议配合快捷键使用**

## 其他功能
### 剪贴板
保留复制的文本、图片和文件，支持回溯和快速粘贴，适合需要重复使用分支名等场景
- 可用于收藏需要短期重复使用的文本，比如需求分支

### 截图OCR
通过截图识别文字，解决无复制权限场景下的文本提取需求

### 搜索Everything
搜索本地电脑文件，搜索速度远远快于文件管理器

### EVER智识
在选中文本后，对不同类型的文本自动判断执行不同的操作，可用于：
- 打开网址
- 在文件管理器中打开文件
- 选中文本后一键搜索

**建议配合快捷键使用**

以下用于实例演示
> https://www.bilibili.com/video/BV1Tf4y1F7Q9/?p=4&spm_id_from=333.788.top_right_bar_window_history.content.click&vd_source=786f9650b60706f85d6b292219d010ff
> C:\Windows\System32\drivers\etc
> Claude Code