---
title: "你好，世界"
date: "2026-03-18"
description: "这是我的第一篇博客文章，记录下这个起点。"
---

开发这个blog网站的时候我是用了当下很火的Spec kit开发

## 我对Spec kit的理解

spec其实就是specify, 翻译过来就是说详细点

不看好，开发前缀太多，目前的主流思想都是尽量精简上下文，它每次开发都要加一堆文件，

运行完spec init之后，创建了一个`.specify`引入一堆文件，总感觉小项目有了它太重
```
- memory
- scripts\powershell
- templates
- integrations
- init-options.json
- integration.json
```

先一步是运行`/speckit.constitution`，建立宪章

初始化的时候我选择了Cursor Agent作为我的AI assitant, 所以Spec-kit还额外增加了一个integrations文件夹，用于执行cursor命令

- .specify/memory/constitution.md

- 命令太长了，不太好记，光是constitution这个词我都觉得好难打