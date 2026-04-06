---
title: "你好，世界"
date: "2026-04-06"
description: "这是我的第一篇博客文章，记录下这个起点。"
tags:
  - "spec-kit"
  - "meta"
---

开发这个blog网站的时候我是用了当下很火的Spec kit开发

## 参考

 全程参考原作者Den Delimarsky的教程：
 - https://www.youtube.com/watch?v=SGHIQTsPzuY&t
 - 原教程是演示如何通过spec kit在Den自己的blog网站上增加一个reading list功能

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
- 这是我的问题，其实在Cursor agent输入框里敲个/就能调用所有命令，手打费时费力Agent还要费时间去查

is the constituion good？

下一步 specify命令

```
/speckit.specify 我想要让博客文章支持tags功能，每个文章应该会有至少一个tag，可以包含多个， 用户可以通过tag路由：`/tags/spec/` 访问包含该tag的所有文章, 方便用户访问特定种类的文章
```

- 加特性，写上你的需求，包括what和why

它做了什么
- 首先，切换到另一个分支
- 然后在`specs`创建了一个详细的需求文档和checklist
  - 需求文档spec.md很详细，有user stories和edge cases 


接下来才是spec-kit的核心功能，clarify, 让AI检查spec中哪些功能不够清晰，

- 这个过程总AI会通过提供选项，问你不清楚的功能要按照什么方式去实现，而你只需要选择即可
- Den在这里花的时间比较多，clarify的5个问题全用了

```
澄清问题 1 / 最多 5 个
背景：Edge Cases 里写了「无文章时仍访问标签地址 → 空列表」；但未说明：从未在任何文章中出现过的 tag slug（例如拼写错误、乱打的 /tags/xyz/）是否与「有 tag、但暂时 0 篇」表现一致。

推荐：选项 A — 与「该标签下暂无文章」一致，统一为 200 + 空列表 + 简短说明。静态博客里不必区分「库里没有这个 tag」和「有这个 tag 但列表为空」，实现和测试都更简单，也和当前「默认不用误导性错误页」一致。

[[列表]]
```

clarify完成之后再进入plan步骤

```
/speckit.plan 在已有网页基础上增加tag特性，已有博客markdown可以增加测试tag，后续我再修改
```

plan完成后再进入task模式拆任务，这中间又会生成一堆文档
- tasks.md

完成之后终于可以通过implement来进行实际的代码改动