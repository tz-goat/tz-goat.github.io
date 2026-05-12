---
title: "Spec-Kit实战"
date: "2026-04-06"
description: "记录我如何通过spec kit优化自己的博客网站，增加tag和选择性展示等功能"
tags:
  - "spec-kit"
  - "meta"
---

开发这个blog网站的时候我是用了当下很火的Spec kit开发

## GOAL

了解spec-kit开发全流程，评估这个流程是否适合长期使用，以及教其他人使用spec-kit
spec-kit分步骤执行，首先consittuion, 然后用specify命令增加需求，接着再用clarify帮助agent澄清疑惑，agent随后用plan命令创建实行计划，接着用tasks执行

- 我的疑问：
  - Q:为什么要分这么多步骤，直接在prompt中写不行就行
  - A: 防止under-specify, 我们写prompt的时候不一定能全部描述清楚需求，所以需要分步骤执行
  - Q：under-specify的部分可以理解，LLM需要更细节，在乎上下文，但是plan和tasks有必要分开吗


## 参考

 全程参考原作者Den Delimarsky的教程：
 - https://www.youtube.com/watch?v=SGHIQTsPzuY&t
 - 原教程是演示如何通过spec kit在Den自己的blog网站上增加一个reading list功能

## 我对Spec kit的理解

spec其实就是specify, 翻译过来就是说详细点

一开始我是有点不看好，觉得开发前缀太多，目前的主流思想都是尽量精简上下文，它每次开发都要加一堆文件，
- 确实这会导致等待agent运行完成的时间增长，

运行完spec init之后，创建了一个`.specify`引入一堆文件，总感觉小项目有了它太重


```
- memory
- scripts\powershell
- templates
- integrations
- init-options.json
- integration.json
```

### 优点

相比起人，对特性梳理更加细节，比如会有具体的user story保证没有edge case被忽略，不过agent可以用它验证，人也可以
模板化每个步骤的文档产物，这一点的好处一是固定上下文，二是节省实际开发中写PRD的时间，虽然很多时候PRD是产品提的，但是研发针对复杂特性也要写相关技术方案，用speckit可以大大减少下颚稳定的时间
会切换分支

## 实际执行
### 第一步是运行`/speckit.constitution`

建立宪章

初始化的时候我选择了Cursor Agent作为我的AI assitant, 所以Spec-kit还额外增加了一个integrations文件夹，用于执行cursor命令

- .specify/memory/constitution.md

- 不要觉得命令太长了，不太好记，输入框中输入下划线/constitution自动补全


### 下一步 specify命令

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

```
澄清问题 1 / 最多 5 个
背景：Edge Cases 里写了「无文章时仍访问标签地址 → 空列表」；但未说明：从未在任何文章中出现过的 tag slug（例如拼写错误、乱打的 /tags/xyz/）是否与「有 tag、但暂时 0 篇」表现一致。

推荐：选项 A — 与「该标签下暂无文章」一致，统一为 200 + 空列表 + 简短说明。静态博客里不必区分「库里没有这个 tag」和「有这个 tag 但列表为空」，实现和测试都更简单，也和当前「默认不用误导性错误页」一致。

[[列表]]
```

clarify完成之后再进入plan步骤

### plan命令

```
/speckit.plan 我想要让博客文章支持tags功能，每个文章应该会有至少一个tag，可以包含多个， 用户可以通过tag路由：`/tags/spec/` 访问包含该tag的所有文章, 方便用户访问特定种类的文章
```

可以看到这个步骤的具体产物有这些
- Reasearch
  - research.md: 描述这个特性的具体表现，比如frontmatter应该写什么值，以及直链访问隐藏的文章路由时页面怎么表现，同时包括影响面和涉及的文件清单
- Design 
  - data-model.md: 描述这个特性相关的数据模型，包括frontmatter中的属性列表和相关定义
- Contracts 
 - frontmatter.md: 详细解释下本次引入的hidden属性
 - routing.md: 列举当前支持的路由路径，包括tag路由，以及hidden属性的页面的路由表现

### tasks

生成可执行的任务拆解清单，PLAN完成后，下一步就到tasks描述具体实现步骤

- 这一步agent会自动切换git分支到feature分支
- 同时产出一个tasks.md, 包含前置检查：是否已切换了分支，并盘点影响的文件，
- 关键是下个步骤：记录了具体哪些文件需要增加的改动，相比起PLAN步骤中的描述更加具体，具体到文件中的具体方法
- 除此之外还有user story描述具体使用案例
  - 用户只能看到公开的博客
  - 每个story下都有3个independent test方便agent检查story是否符合预期

```
 
 **Purpose**: 在内容解析层引入“可见性”能力，供所有页面复用
 
 **⚠️ CRITICAL**: User Story 阶段任务依赖本阶段完成
 
- [ ] T004 在 `lib/posts.ts` 为 `PostMeta` 增加 `hidden: boolean` 字段（缺省为 `false`）
- [ ] T005 在 `lib/posts.ts` 的 frontmatter 解析中读取 `hidden`（允许缺省；当为 truthy 时视为隐藏）
- [ ] T006 在 `lib/posts.ts` 的 `getAllPosts()` 默认过滤隐藏文章（仅返回公开文章）
- [ ] T007 在 `lib/posts.ts` 的 `getAllTagSlugs()` 基于公开文章生成 tag 集合（避免隐藏文章导致生成多余 tag 页面）
- [ ] T008 在 `lib/posts.ts` 的 `getPostsByTagSlug()` 确保只返回公开文章（即使未来内部实现变更也不泄露）
- [ ] T009 在 `lib/posts.ts` 的 `getPostBySlug()` 读取到 `hidden: true` 时抛出错误（由路由层 `notFound()` 处理）
 
 **Checkpoint**: `lib/posts.ts` 能区分公开/隐藏文章，且隐藏文章不会出现在任何聚合结果中
```

能看到它这里增加了很多checklist, 在验收的过程中agent也会按照checkList去进行验收，所以这个步骤的运行时间相对较长，
- 它底层是怎么验证的是个黑盒，最好还是自己坐下测试