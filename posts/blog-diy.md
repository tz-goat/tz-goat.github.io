---
title: "我是怎么搭建我的博客网站的"
date: "2026-04-06"
description: "技术栈选型和依赖包"
tags:
  - "blog"
  - "diy"
---

## 为什么要搭博客

首先，为什么要有自己的博客网站？

看到很多同行都开了自己的博客网站，记录自己的面试准备过程，或者是对前沿技术的心得，博客也是自己技术实力的一种体现。

此外，工作中一定会产生很多自己的思考和沉淀。我自己平常又会写很多笔记，博客就是自己笔记的汇总和提总。


## 技术栈选型

之前在data.ai(已被Sensor Tower收购)上班时，公司用的前端框架就是Next.js, 而在富途和店小秘的业务组都是主要用Vue。对React的理解使用在回国之后慢慢弱了一些，但是后来在进行面试准备的时候发现一线大厂更偏向React。所以为了保持对技术栈的熟悉，我决定自己的博客还是要用Next.js来写。


## 初始化-搭建过程

Cursor是我平常使用最多的工具，所以我的这个博客当然是通过Cursor来搭建的

本来想过v0选一个好看点的主题，后来觉得还是一切从简，按需添置就好。 而且Cursor本身搭出来的网站我也足够满意了。

```md
这是我的next.js博客项目，教教我怎么添加我的第一篇博客
```

在我输入上述命令后，Cursor直接搭出来一套完整的博客系统，共做了以下几件事：



**1. 安装了 3 个依赖**

- `gray-matter` —— 解析 Markdown 文件顶部的 frontmatter（`title`、`date` 这些元数据）
- `remark` + `remark-html` —— 把 Markdown 正文转成 HTML
- `@tailwindcss/typography` —— 让 Markdown 渲染出来的 HTML 有好看的排版样式


 

**2. 创建了第一篇文章 `posts/hello-world.md`**

```bash
posts/
└── hello-world.md   ← 你以后每篇文章都放在这里
```

文件顶部是 frontmatter（`---` 包裹的部分），定义标题、日期、描述；下面是正文 Markdown 内容。


**3. 创建了 `lib/posts.ts`**

两个工具函数：
- `getAllPosts()` —— 读取 `posts/` 目录下所有 `.md` 文件，解析 frontmatter，按日期倒序排列，用于列表页
- `getPostBySlug(slug)` —— 根据文件名读取单篇文章，把 Markdown 转成 HTML，用于详情页



**4. 新增了示列页面并改造首页**

从原来的 Next.js 默认欢迎页，换成了展示最近 3 篇文章 + "全部文章 →" 链接的博客首页。

```markdown
| 路由 | 文件 | 作用 |
|------|------|------|
| `/blog` | `app/blog/page.tsx` | 文章列表，展示所有文章 |
| `/blog/hello-world` | `app/blog/[slug]/page.tsx` | 文章详情，动态路由 |
|------|------|------|
```

**5. 改造了首页 `app/page.tsx`**



---

**以后写新文章只需一步：** 在 `posts/` 目录下新建一个 `.md` 文件，按这个格式写 frontmatter，文章就自动出现了：

```markdown
---
title: "文章标题"
date: "2026-03-18"
description: "一句话简介"
---

正文内容...
```

## 0813-代码块高亮和样式更新

最近又把博客文章的 Markdown 渲染链路升级了一次，主要是为了解决 3 个比较明显的问题：

1. 代码块虽然能识别出来，但没有语法高亮
2. 长代码行默认只能横向滚动，阅读体验一般
3. 行内 `code` 只有很轻的默认样式，不够醒目

之前的实现是 `remark + remark-html`，它的优点是简单，能很快把 Markdown 变成 HTML。但是它更像“先把文章显示出来”，对于技术博客常见的代码高亮、代码块换行和行内代码样式，就需要继续补能力。

### 这次新增的依赖

- `remark-gfm`
  - 让 Markdown 支持 GitHub 风格语法，比如表格、任务列表、删除线等
- `remark-rehype`
  - 把 Markdown AST 转成 HTML AST，方便后续继续接入 rehype 生态插件
- `rehype-pretty-code`
  - 负责代码块和行内代码的语法高亮，底层使用 Shiki 风格的高亮能力
- `rehype-stringify`
  - 把处理完的 HTML AST 再转回 HTML 字符串，继续兼容我现在的博客渲染方式

### 这次是怎么改的

新的正文处理链路变成了：

```ts
remark()
  .use(normalizeMarkdownCodeLanguages)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypePrettyCode, prettyCodeOptions)
  .use(rehypeStringify)
```

这里有两个比较关键的技术点。

**1. 在高亮前先规范代码块语言名**

我后来排查时发现，新文章里有些代码块写的是 ```` ```JavaScript ````，而不是更常见的 `javascript` / `js`。  
如果语言名没有被高亮器识别，代码块虽然还是 `<pre><code>`，但里面只会是普通文本，不会生成真正的彩色 token。

所以我在渲染链路里先加了一步 `normalizeMarkdownCodeLanguages`，把 fenced code block 的语言名统一转成小写。这样旧文章和新文章都能兼容，不需要回头手动逐篇修改。

**2. 高亮和样式是两层职责**

这次改动里我更明显地理解了：

- 高亮插件负责把代码切成 token，并输出带颜色变量的 HTML 结构
- CSS 负责代码块外观，比如背景、圆角、边框、折行方式，以及行内 `code` 的视觉样式

也就是说，代码高亮不是“装了插件就自动全部完成”，中间其实还是会落到浏览器能理解的 HTML + CSS 上。

### CSS 这次补了什么

除了高亮插件，我还在 `globals.css` 里补了一层代码块样式，重点包括：

- 给代码块增加背景、边框和圆角
- 用 `white-space: pre-wrap` 和 `overflow-wrap: anywhere` 让长代码行可以自动换行
- 给行内 `code` 增加更清晰的背景和内边距
- 根据明暗模式，分别读取 `--shiki-light` / `--shiki-dark` 变量来显示高亮颜色

这里也顺手补上了简短注释，方便以后回看时更快理解每段选择器在控制什么。

### 这次改动后的效果

升级之后，博客里的代码展示体验终于更像一个技术博客了：

- 普通代码块有语法高亮
- 长代码默认不用横向拖动也能读
- 行内 `code` 更容易从正文里被识别出来
- 现有的 Markdown 渲染方式没推翻，整体改动还比较克制

这次改动虽然不算大，但对阅读体验的提升非常直接，也让我更清楚地理解了 Markdown、HTML、代码高亮和 CSS 样式之间的分工关系。
