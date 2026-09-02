---
title: "Spec-Kit实战"
date: "2026-04-06"
description: "本篇文章记录我如何通过spec kit优化自己的博客网站，增加tag和选择性展示等功能，以及对spect-kit使用的一些个人感悟"
tags:
  - "spec-kit"
  - "meta"
---

开发这个blog网站的时候我是用了当下很火的Spec kit开发流程
to-do： 这里还需要一个目录，目录，目录

<!-- 写spect-kit应该cover什么

what

优点

缺点

怎么使用spec-kit， 这其中包含哪些坑点
- 这里可以增加一个命令行
- 

如何用最好，什么样的项目适合用spec-kit

创建一个项目用spec-kit,  -->

## 0701速记

constitution可以规定项目的整体原则，比如这个项目的目的，代码风格
`speckit-constitution` 这是一个网页游戏应用，应当保持代码整洁，核心代码要有注释提示
- 不仅可以通过skill更新，也可以直接让agent去更新这个文件：.specify/memory/constitution.md

Clarify underspecified areas (recommended before /speckit.plan);

specify声明特性，在constitution完成后执行，声明你想增加的特性，
- `speckit-specify` 创建一个基础的web 小游戏应用平台，主要用途娱乐，教育，儿童友好，方便我在开发过程中熟悉基础算法知识
生成一个spec.md:其中包含多个用户案例，user story，比如用户可以无需登陆打开游戏试玩
functional requirements
- 网站必须提供游戏列表供选择，游戏中必须包含相应的教育性内容

PLAn技术选型
- 我专门挑了我不太熟悉的html canavs和naive UI,
- 有research.md对于技术选型做调研，对比其他同类型技术
- data-model.md，对于选中的游戏的数据模型

taks将任务细化成具体的可实现的操作
- 这一步就可以切换模型，切换成可以去具体实现


## 什么是Spec-kit

Spec-kit是一个Spec-Driven Development开发思想的实践工具，通过安装specify-cli命令行工具，可以细化开发流程中的特性

spec其实就是specify的缩写, 翻译过来就是说详细点,Spec-Driven Development的核心在于将以往**代码优先于说明**的优先级反过来，在添加特性时，尽可能细化需求描述，从而使得代码更加贴合预期的需求实现


## 为什么要写spec-kit

借着搭博客网站的机会，了解下最近很火的spec-kit开发全流程，评估这个流程是否适合个人项目的长期使用，并总结下自己在使用过程中的体会与经验

## 参考

参考原作者Den Delimarsky的教程, 视频里Den演示了如何通过spec-kit在自己**已有**的博客项目里上增加一个reading list功能：

- [Using GitHub Spec Kit with your EXISTING PROJECTS](https://www.youtube.com/watch?v=SGHIQTsPzuY&t)




## 安装

```
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z

```

## 实际执行

在实际使用specify之前需要先初始化项目，通常要引入，就运行下面的命令
```
specify init --here
```

spec-kit分步骤执行，首先要通过constituion初始化项目, 然后用specify命令增加需求，接着再用clarify帮助agent澄清本次新增特性的疑惑点，agent随后用plan命令创建实行计划，接着用tasks列出细致的实现细节，最后运行implement命令按照tasks中的步骤实现功能

比如过我要给我的博客增加一个特性，那在这之前
- const: 初始化项目
- /speckit.plan command to provide your tech stack and architecture choices.

### spec-kit的文件结构

spec-kit会创建一个`.specify`文件夹，里面包含以下文件

```
- memory
- scripts\powershell
- templates
- integrations
- init-options.json
- integration.json
```

### 1. constitution

constitution直译为宪章，在初始化的时候运行一次就好

它会描述这个项目的基础技术栈和定位，方便后续开发时候进行参考

这里会产出一个`constitution.md`文件，定义在这里`.specify/memory/constitution.md`

初始化的时候我选择了Cursor Agent作为我的AI assistant, 所以Spec-kit还额外在`.cursor`文件夹下增加了相关的配置文件

- `.cursor/commands`: 这个文件夹下包含了cursor agent的命令，比如`/speckit`，`/speckit.specify`，`/speckit.clarify`等等
- `.cursor/rules`: 这个文件夹下增加了一个`specify-rules.mdc`文件，有个`Recent-changes`模块会记录每次speckit模式添加的特性

- 不要觉得命令太长了不好记，输入框中输入`/constitution`等待Agent自动补全command字段就行

### 2. specify

这一步加特性，写上你的需求，包括what和why

```
/speckit.specify 我想要让博客文章支持tags功能，每个文章应该会有至少一个tag，可以包含多个， 用户可以通过tag路由：`/tags/spec/` 访问包含该tag的所有文章, 方便用户访问特定种类的文章
```

**它做了什么?**

- 首先，自动切换到一个新的分支：`001-blog-post-tags`
- 然后在`specs`创建了一个详细的需求文档和checklist
  - 需求文档spec.md很详细，有user stories和edge cases

### 3. clarify

我认为clarify,才是spec-kit的核心功能，让AI继续检查上一步哪些功能不够清晰，这个过程中Agent会逐个列出不清楚的功能，并通过提供选项问你要按照什么方式去实现

虽然我们平常开发也可以通过提示词的方式让AI在修改前反问搞清楚变动方向，但远没有这么细致

```markdown
澄清问题 1 / 最多 5 个
背景：Edge Cases 里写了「无文章时仍访问标签地址 → 空列表」；但未说明：从未在任何文章中出现过的 tag slug（例如拼写错误、乱打的 /tags/xyz/）是否与「有 tag、但暂时 0 篇」表现一致。

推荐：选项 A — 与「该标签下暂无文章」一致，统一为 200 + 空列表 + 简短说明。静态博客里不必区分「库里没有这个 tag」和「有这个 tag 但列表为空」，实现和测试都更简单，也和当前「默认不用误导性错误页」一致。

[[列表]]
```

### 4. plan

to-do: plan和tasks的区别是什么，这里要填什么，跟前面的specify和clarify有什么区别，

- 执行到这里的时候是不是不填也可以？

```
/speckit.plan
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

这一步生成可执行的任务拆解清单-tasks.md，它的内容如下

1. 前置检查：是否已切换了分支，并盘点影响的文件，
2. 关键是下个步骤：记录了具体哪些文件需要增加的改动，相比起PLAN步骤中的描述更加具体，具体到文件中的具体方法
3. 还有user story描述具体使用案例: 比如用户只能看到公开的博客
   - 每个story下都有3个independent test方便agent检查story是否符合预期

```markdown
**Purpose**: 在内容解析层引入“可见性”能力，供所有页面复用

**⚠️ CRITICAL**: User Story 阶段任务依赖本阶段完成

- [ ] T004 在 `lib/posts.ts` 为 `PostMeta` 增加 `hidden: boolean` 字段（缺省为 `false`）
- [ ] T005 在 `lib/posts.ts` 的 frontmatter 解析中读取 `hidden`（允许缺省；当为 truthy 时视为隐藏）
- [ ] T006 在 `lib/posts.ts` 的 `getAllPosts()` 默认过滤隐藏文章（仅返回公开文章）

  **Checkpoint**: `lib/posts.ts` 能区分公开/隐藏文章，且隐藏文章不会出现在任何聚合结果中
```

- 能看到它这里增加了很多checklist, 在执行下一步`implement`的时候agent会按照这里的checkList去进行验收，所以这个步骤的运行时间相对较长

```markdown
## Phase 3: User Story 1 - 访客仅能看到公开文章 (Priority: P1) 🎯 MVP

**Goal**: 首页与博客列表不展示隐藏文章

**Independent Test**: 准备至少 1 篇隐藏文章后，访问 `/` 与 `/blog`，隐藏文章不出现在列表中；其他文章正常展示

- [ ] T010 [P] [US1] 验证 `app/page.tsx` 首页“最新文章”列表不会展示隐藏文章（依赖 `getAllPosts()` 输出）
- [ ] T011 [P] [US1] 验证 `app/blog/page.tsx` 博客列表不会展示隐藏文章（依赖 `getAllPosts()` 输出）

  **Checkpoint**: 仅完成 US1 仍可独立演示：隐藏文章不会出现在主要列表入口
```

- 它底层是怎么验证的是个黑盒，最好还是自己做下测试

## Q&A
  - Q:为什么要分这么多步骤，直接在prompt中写不行就行
  - A: 防止under-specify, 我们写prompt的时候不一定能全部描述清楚需求，所以需要分步骤执行
  - Q：under-specify的部分可以理解，LLM需要更细节，在乎上下文，但是plan和tasks有必要分开吗

  
## 我的评价

spec其实就是specify, 翻译过来就是说详细点

一开始我是有点不看好，觉得开发前置工作量太多，目前的主流思想都是尽量精简上下文，它每个步骤缺都要加一堆文件，

- 特别是初始化的时候，spec init创建了一个`.specify`引入一堆文件，总感觉小项目有了它太重，确实这会导致等待agent运行完成的时间增长

但是运行过之后我对于这种开发流程有了新的认识，我不再觉得这些文件是累赘

它确实能帮助梳理需求，特别是对于复杂特性，能保证没有遗漏的edge case，比如我增加tag功能，agent会帮我梳理出哪些路由需要增加，哪些文件需要修改，哪些测试用例需要增加，哪些文档需要补充，而且这些文件都是模板化的，可以复用，所以不会增加太多工作量

还有spec-kit会在实现特性的过程中自动切换分支，这一点很方便

