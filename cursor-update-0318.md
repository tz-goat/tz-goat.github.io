给你的裸 Next.js 项目搭了一套完整的 Markdown 博客系统，共做了以下几件事：

---

**1. 安装了 3 个依赖**

- `gray-matter` —— 解析 Markdown 文件顶部的 frontmatter（`title`、`date` 这些元数据）
- `remark` + `remark-html` —— 把 Markdown 正文转成 HTML
- `@tailwindcss/typography` —— 让 Markdown 渲染出来的 HTML 有好看的排版样式

---

**2. 创建了第一篇文章 `posts/hello-world.md`**

```
posts/
└── hello-world.md   ← 你以后每篇文章都放在这里
```

文件顶部是 frontmatter（`---` 包裹的部分），定义标题、日期、描述；下面是正文 Markdown 内容。

---

**3. 创建了 `lib/posts.ts`**

两个工具函数：
- `getAllPosts()` —— 读取 `posts/` 目录下所有 `.md` 文件，解析 frontmatter，按日期倒序排列，用于列表页
- `getPostBySlug(slug)` —— 根据文件名读取单篇文章，把 Markdown 转成 HTML，用于详情页

---

**4. 新增了两个页面**

| 路由 | 文件 | 作用 |
|------|------|------|
| `/blog` | `app/blog/page.tsx` | 文章列表，展示所有文章 |
| `/blog/hello-world` | `app/blog/[slug]/page.tsx` | 文章详情，动态路由 |

---

**5. 改造了首页 `app/page.tsx`**

从原来的 Next.js 默认欢迎页，换成了展示最近 3 篇文章 + "全部文章 →" 链接的博客首页。

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