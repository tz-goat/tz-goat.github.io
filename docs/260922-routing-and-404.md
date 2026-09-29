# 260922-路由管控与 404 兜底说明

## 一句话总结

这个博客用 Next.js 16 App Router 做**约定式文件系统路由**，通过 `output: "export"` 走**静态导出**，动态路由靠 `generateStaticParams` 在构建期枚举；404 兜底分两层——代码层用 `notFound()` 处理「资源不存在」，部署层靠静态导出自动产出的 `404.html` 交给 GitHub Pages 兜住未知路径。

## 这份文档解决什么问题

路由和 404 分散在多个文件里：

- `next.config.ts` 里的 `output: "export"` 静态导出配置
- `app/` 目录结构决定的 URL 映射
- `app/blog/[slug]/page.tsx` 里的 `generateStaticParams` 和 `notFound()`
- `app/tags/[tag]/page.tsx` 里不同的空状态策略
- `lib/posts.ts` 里 `getPostBySlug` 的抛错逻辑
- `.github/workflows/deploy.yml` 里部署到 GitHub Pages 的闭环

只看单个文件容易看懂局部，串不起来「为什么这样设计」。这份文档补齐这层维护语境，同时整理成可直接用于面试的回答。

## 一、路由是怎么管控的

### 1. 文件系统路由（约定式路由）

路由完全由 `app/` 目录结构决定，没有手写路由表：

| 文件                       | 对应 URL                      |
| -------------------------- | ----------------------------- |
| `app/layout.tsx`           | 全局根布局（包所有页面）      |
| `app/page.tsx`             | `/`（首页）                   |
| `app/blog/page.tsx`        | `/blog`（文章列表）           |
| `app/blog/[slug]/page.tsx` | `/blog/:slug`（动态文章详情） |
| `app/tags/[tag]/page.tsx`  | `/tags/:tag`（动态标签页）    |

### 2. 动态路由靠 `generateStaticParams` 在构建期枚举

因为 `next.config.ts` 里配了 `output: "export"`，**整个站点是纯静态 HTML，没有 Node 服务端**。所以动态路由必须在构建时把路径列出来：

```ts
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
```

```ts
// app/tags/[tag]/page.tsx
export async function generateStaticParams() {
  return getAllTagSlugs().map((tag) => ({ tag }));
}
```

数据源是 `lib/posts.ts`：用 `fs` 读 `posts/*.md` + `gray-matter` 解析 frontmatter，`remark/rehype` 转 HTML。`generateStaticParams` 返回的数组 → 构建时产出 `out/blog/xxx.html`、`out/tags/xxx.html`。

### 3. 服务端组件为主 + 少量客户端「岛」

页面基本都是服务端组件（直接读文件系统），只有需要交互 / 浏览器 API 的地方才 `"use client"`：

- `app/analytics-link.tsx`（点击埋点）
- `app/blog/[slug]/post-view-tracker.tsx`（浏览埋点）
- `app/blog/[slug]/post-content.tsx`（medium-zoom、mermaid 渲染）

## 二、404 兜底是怎么做的

### 核心：`notFound()` + 默认 404 页 + 静态托管 `404.html`

**文章详情页的兜底链路（最关键）：**

```ts
// app/blog/[slug]/page.tsx
export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);   // 读文件失败会 throw
  } catch {
    notFound();                          // 关键：转成 404
  }
  ...
}
```

```ts
// lib/posts.ts
export async function getPostBySlug(slug: string): Promise<Post> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8"); // 文件不存在 → 抛错
  ...
  if (meta.hidden) throw new Error("Post is hidden");     // 隐藏文章也走 404
}
```

触发 404 的两种情况：

1. **路径拼接后文件不存在**：`/blog/不存在的slug` → `readFileSync` 抛 `ENOENT` → 被 `catch` → `notFound()`
2. **frontmatter 里 `hidden: true`**：文章文件存在但不公开 → 主动 throw → `notFound()`

`notFound()` 来自 `next/navigation`，它会抛一个特殊的 `NEXT_NOT_FOUND` 错误，被 Next 的路由层捕获，渲染最近的 not-found 边界。

**metadata 也有兜底：**

```ts
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    return { title: post.title, description: post.description };
  } catch {
    return {}; // 拿不到就不返回元信息，而不是让构建/渲染崩
  }
}
```

访问不存在路由： `/blog/not-exist`的**完整链路**如下：

1.  用户访问 /blog/not-exist → Next 匹配到 app/blog/[slug]/page.tsx，slug = "not-exist"
2.  页面里调 getPostBySlug("not-exist")
3.  它 path.join 拼出 posts/not-exist.md，fs.readFileSync → 文件不存在，抛 ENOENT
4.  page.tsx 里的 try/catch 接住 → 调 notFound()
5.  notFound() 抛 NEXT_NOT_FOUND 特殊错误 → Next 路由层识别 → 渲染 404 页
6.  静态托管层再返回 404.html

### 没有自定义 `app/not-found.tsx`

项目里没有自定义 404 页，用的是 Next 内置默认 404。但因为开了静态导出，Next 构建时会自动生成：

- `out/404.html`
- `out/_not-found.html`

这个项目部署在 **GitHub Pages**（`.github/workflows/deploy.yml` 里 `peaceiris/actions-gh-pages` 发布 `./out`），GitHub Pages 对未知路径会自动返回根目录的 `404.html`，所以兜底闭环是通的。

### 标签页的 404 策略不一样

```ts
// app/tags/[tag]/page.tsx
export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = getPostsByTagSlug(tag);  // 不存在的 tag 返回空数组，不抛错
  ...
  {posts.length === 0 ? (
    <p>暂无带此标签的文章（或该标签尚未在内容中使用）。</p>
  ) : (...)}
}
```

标签页对不存在的 tag **不 404，而是显示空状态文案**。这是一个刻意的 UX 选择：标签页本质是「过滤结果」，空结果 ≠ 资源不存在，比直接 404 更友好。

## 三、面试怎么答

### 建议的答题结构（30 秒～1 分钟版本）

> 这个博客用的是 Next.js 16 的 App Router，**路由靠文件系统约定生成**，`app/` 下的目录结构直接映射成 URL，动态路由用 `[slug]`、`[tag]` 这种文件夹命名。因为整个项目配了 `output: "export"` 做静态导出、部署到 GitHub Pages，所以动态路由必须在构建期用 `generateStaticParams` 把所有可能的路径枚举出来，构建时就会为每篇文章、每个标签生成独立的 HTML。
>
> 404 兜底分两层：**代码层**，文章详情页里我用 `getPostBySlug` 去 `fs.readFileSync` 读对应 markdown，文件不存在或标记了 `hidden` 都会 throw，我在页面里 try/catch 住然后调 `notFound()`，这是 Next 官方推荐的处理方式；**部署层**，因为静态导出，构建时会自动产出 `404.html`，GitHub Pages 对不存在的路径会自动返回这个文件。另外我故意让标签页不 404，而是显示「暂无此标签的文章」的空状态，因为标签本质是过滤结果，空结果不该当错误处理。

### 加分点（面试官追问时可以展开）

1. **`notFound()` 的原理**：它抛出一个特殊的 `NEXT_NOT_FOUND` 错误对象，由 Next 的路由层识别，渲染最近的 not-found 边界。它和 `error.tsx` 错误边界是两套机制——`notFound` 是「资源不存在」，`error` 是「运行时异常」，前者不会触发错误上报 / 重试。

2. **动态路由 + 静态导出的配合**：这是面试官最容易问的坑。`output: "export"` 下如果动态路由没写 `generateStaticParams`，构建会报错或者页面出不来，必须枚举。而且 `generateMetadata` 里也要兜底，否则一个不存在的 slug 会同时污染 SEO 元信息。

3. **`hidden` 文章双重防护**：数据层 `getAllPosts` 用 `.filter(p => !p.hidden)` 保证列表不出现；路由层 `getPostBySlug` 再 `throw` 保证直接输 URL 也进不去（纵深防御，而不是只靠前端隐藏）。

4. **自定义 404 的改进空间**：目前用的是默认 404 页，可以加一个 `app/not-found.tsx` 做品牌化 404（放回首页链接、加埋点统计「用户走到了死链」），对静态导出同样会生成 `404.html`。

5. **`output: "export"` 开启的意义** 让构建产物变成纯静态文件，部署时不需要 Node 服务器，直接丢给 GitHub Pages 这种静态托管。如果删掉它，Next 就走默认的服务端渲染（SSR），动态路由 /blog/[slug] 会在请求时才由 Node 服务端去读文件、渲染页面，而不是构建时就固化好。

### 一个易被问到的对比点

> **为什么不存在的 tag 不 404，而不存在的文章要 404？**
>
> 因为两者语义不同：`/blog/:slug` 是一个明确的资源地址，资源不存在就是 404；`/tags/:tag` 是「带这个标签的文章列表」这个集合查询，空集合是合法的查询结果，返回空状态对 SEO 和用户体验都更好，404 反而会让搜索引擎误以为页面坏了。

## 关键文件职责

- `next.config.ts`
  - 配置 `output: "export"` 启用静态导出
  - `basePath` 留空，适配 `username.github.io` 形式的 GitHub Pages
- `app/layout.tsx`
  - 全站根布局，装配主题 Provider、SEO 元信息、首屏脚本
- `app/page.tsx`
  - 首页，读 `getAllPosts()` 取最近 3 篇
- `app/blog/page.tsx`
  - 文章列表页
- `app/blog/[slug]/page.tsx`
  - `generateStaticParams` 枚举所有文章 slug
  - `getPostBySlug` 失败时 `notFound()`
- `app/tags/[tag]/page.tsx`
  - `generateStaticParams` 枚举所有标签
  - 空结果展示空状态而非 404
- `lib/posts.ts`
  - 读 `posts/*.md`、解析 frontmatter、转 HTML
  - `getPostBySlug` 对不存在 / 隐藏文章抛错，作为 404 的触发源
- `.github/workflows/deploy.yml`
  - lint + build 后把 `./out` 发布到 GitHub Pages
