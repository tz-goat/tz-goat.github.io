# Markdown 渲染升级计划

## Summary

将博客文章的 Markdown 渲染管线从当前的 `remark + remark-html` 升级为：

- `remark`
- `remark-gfm`
- `remark-rehype`
- `rehype-pretty-code`
- `rehype-stringify`

并补充代码块自动折行样式，以同时解决以下问题：

- 长代码行需要横向滚动，无法在常规视口内完整阅读
- 代码块没有语法高亮
- 行内 `code` 仅有 Typography 默认轻样式，辨识度偏弱

本次计划保持现有“服务端预处理 Markdown，页面渲染 HTML 字符串”的架构，不切换到 `react-markdown` 组件渲染模式；同时按确认结果继续忽略 Markdown 中的原始 HTML / 自定义标签。

## Current State Analysis

### 当前渲染链路

- [`lib/posts.ts`](file:///Users/dateng/my-blog/lib/posts.ts) 负责读取 `posts/*.md`，解析 frontmatter，并在 `getPostBySlug()` 中将正文转为 HTML。
- 当前实现位于 [`lib/posts.ts:L124-L135`](file:///Users/dateng/my-blog/lib/posts.ts#L124-L135)，仅使用 `remark().use(html)`。
- 详情页在 [`app/blog/[slug]/page.tsx:L67-L69`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/page.tsx#L67-L69) 通过 `dangerouslySetInnerHTML` 输出 `post.contentHtml`。
- 全局样式通过 [`app/globals.css`](file:///Users/dateng/my-blog/app/globals.css) 启用了 Tailwind Typography：`@plugin "@tailwindcss/typography";`

### 已确认的现状问题

1. **代码块无高亮**
   - 当前依赖仅包含 `remark` 与 `remark-html`，见 [`package.json:L11-L21`](file:///Users/dateng/my-blog/package.json#L11-L21)。
   - 生成 HTML 仅包含 `<pre><code class="language-xxx">...</code></pre>`，没有高亮 token。

2. **长代码行不自动折行**
   - 构建产物中的 Typography 规则对 `.prose pre` 使用 `overflow-x: auto`。
   - 未见 `white-space: pre-wrap` 或 `overflow-wrap: anywhere` 之类的代码块折行规则。

3. **行内 `code` 样式较弱**
   - 当前仅依赖 Typography 默认样式，未做自定义增强。

### 真实内容特征（基于 `posts/` 扫描）

- 已存在多篇文章使用 fenced code block，语言标记包括 `js`、`md`、`markdown`、`JavaScript`。
- 已存在标准 Markdown 表格；引入 `remark-gfm` 后将可稳定支持表格等 GFM 语法。
- 存在大量行内代码片段。
- 存在原始 HTML / 自定义标签（如 `readonly-block`），但当前管线输出中未保留；本次按确认结果继续忽略，不新增支持。

## Assumptions & Decisions

### 已锁定决策

1. **渲染架构不变**
   - 继续在服务端将 Markdown 转成 HTML 字符串。
   - 页面层继续通过 `dangerouslySetInnerHTML` 渲染，不切换到 React 组件化 Markdown 渲染。

2. **继续忽略原始 HTML / 自定义标签**
   - 不引入 `rehype-raw`。
   - 不为 `readonly-block` 等自定义标签做兼容。

3. **代码块默认自动折行**
   - 目标是“常规视口下尽量无需横向滚动即可读完整代码”。
   - 优先使用保留缩进与换行语义的折行方式，不使用破坏可读性的激进断词策略作为首选。

4. **高亮方案采用 Shiki 系**
   - 通过 `rehype-pretty-code` 提供代码块和行内代码高亮基础能力。
   - 主题采用亮/暗双主题方案，具体建议使用适合技术博客的常见主题组合（如 GitHub Light / GitHub Dark），实现时在代码中显式配置。

5. **本轮范围控制**
   - 本次不加入复制按钮、代码块标题栏、行号、指定行高亮等增强功能。
   - 本次聚焦“渲染正确、展示清晰、样式稳定”。

## Proposed Changes

### 1. 更新 Markdown 渲染依赖

**文件：** [`package.json`](file:///Users/dateng/my-blog/package.json)

**变更内容：**

- 移除 `remark-html`
- 新增：
  - `remark-gfm`
  - `remark-rehype`
  - `rehype-pretty-code`
  - `rehype-stringify`

**原因：**

- `remark-html` 只能输出普通 HTML，无法满足高亮与更强的 Markdown 渲染控制需求。
- 新管线可以在保持 HTML 字符串输出的前提下，补齐 GFM 支持与代码高亮能力。

**实现要点：**

- 保留 `remark` 与 `gray-matter`。
- 安装后需要确保类型与运行时均能在 Next.js 服务端正常工作。

### 2. 重构文章正文 HTML 生成逻辑

**文件：** [`lib/posts.ts`](file:///Users/dateng/my-blog/lib/posts.ts)

**变更内容：**

- 替换 `remark-html` 导入与使用方式。
- 将 `getPostBySlug()` 中的 Markdown 处理逻辑改为：
  1. `remark()`
  2. `.use(remarkGfm)`
  3. `.use(remarkRehype)`
  4. `.use(rehypePrettyCode, { ... })`
  5. `.use(rehypeStringify)`

**原因：**

- 这是本次功能升级的核心入口，所有文章详情页内容都从这里生成。

**实现要点：**

- 对 `rehypePrettyCode` 显式配置 `theme`，同时支持亮色和暗色。
- 明确 `keepBackground` 策略，避免高亮插件输出的背景和 Typography / 自定义样式冲突。推荐在实现时关闭内建背景或统一由 CSS 控制。
- 保持函数签名不变，仍返回 `contentHtml: string`，避免影响现有页面调用。
- 不开启原始 HTML 解析，保持“继续忽略原始 HTML / 自定义标签”的行为。

### 3. 补充代码块与行内代码样式

**文件：** [`app/globals.css`](file:///Users/dateng/my-blog/app/globals.css)

**变更内容：**

- 在现有 Typography 基础上增加 `.prose pre`、`.prose pre code`、`.prose code` 的自定义样式覆盖。

**原因：**

- `rehype-pretty-code` 负责生成高亮相关结构，但“是否自动折行”“容器边距/圆角/背景”“行内 code 视觉强化”仍需要项目样式层统一控制。

**实现要点：**

- 代码块：
  - 对 `.prose pre` 设置自动折行策略，优先考虑：
    - `white-space: pre-wrap`
    - `overflow-wrap: anywhere`
  - 避免再依赖纯 `overflow-x: auto` 作为唯一体验。
  - 保留适度 `overflow-x` 兜底，防止极端场景布局损坏。
- 代码块内部：
  - 确保 `.prose pre code` 继承字体和颜色，不重复出现 Typography 默认反引号伪元素。
  - 兼容 `rehype-pretty-code` 输出结构，避免样式被 Typography 覆盖。
- 行内代码：
  - 补充背景色、圆角、左右 padding、合适字号。
  - 深浅色模式下颜色保持一致可读性。

### 4. 校验文章详情页是否需要轻量样式配合

**文件：** [`app/blog/[slug]/page.tsx`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/page.tsx)

**预期变更：**

- 大概率不需要结构性修改。
- 仅在实现时检查现有 `prose prose-zinc dark:prose-invert max-w-none` 是否足够承载新样式。

**原因：**

- 当前容器类已经能提供正文排版能力；本次主要是内容生成与样式覆盖升级。

**实现要点：**

- 若高亮主题输出需要外层辅助类，再在该容器上最小化补充 class。
- 若现有类已足够，则保持页面代码不变，减少变更面。

### 5. 用真实文章回归验证多种 Markdown 形态

**文件范围：**

- [`posts/blog-diy.md`](file:///Users/dateng/my-blog/posts/blog-diy.md)
- [`posts/hello-world.md`](file:///Users/dateng/my-blog/posts/hello-world.md)
- [`posts/quicker.md`](file:///Users/dateng/my-blog/posts/quicker.md)
- [`posts/file-interaction-review.md`](file:///Users/dateng/my-blog/posts/file-interaction-review.md)

**原因：**

- 这些文章覆盖了代码块、表格、行内代码、长代码行和原始 HTML 标签等不同输入形态。

**验证重点：**

- 代码块是否有高亮
- 长代码行是否在内容宽度内自动折行
- 行内 `code` 是否视觉更清晰
- Markdown 表格是否正确渲染
- 原始 HTML / 自定义标签是否仍按既定决策忽略

## Implementation Steps

1. 调整依赖，移除 `remark-html`，新增 `remark-gfm`、`remark-rehype`、`rehype-pretty-code`、`rehype-stringify`
2. 重构 [`lib/posts.ts`](file:///Users/dateng/my-blog/lib/posts.ts) 中的 Markdown 处理链路
3. 在 [`app/globals.css`](file:///Users/dateng/my-blog/app/globals.css) 中增加代码块折行和代码样式覆盖
4. 视实现效果决定是否对 [`app/blog/[slug]/page.tsx`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/page.tsx) 做最小化 class 调整
5. 本地构建并检查代表性文章的生成结果与页面表现

## Verification

### 必做验证

1. 运行构建，确认 Markdown 处理链路无类型或构建错误。
2. 检查至少 4 篇代表性文章页面：
   - 普通代码块
   - 带语言标记的代码块
   - 长代码行
   - Markdown 表格
   - 行内代码
3. 确认长代码行在常规桌面宽度下无需横向滚动即可完整阅读。
4. 确认深色模式下代码高亮与行内代码仍可读。

### 验收标准

- 用户在博客详情页能直接看到完整长代码行，默认不需要横向拖动才能阅读
- 代码块具备清晰语法高亮
- 行内 `code` 具有明显但不过度突兀的代码样式
- 现有文章标题、列表、标签、静态导出能力不受影响
- Markdown 中原始 HTML / 自定义标签继续忽略，行为与当前决策一致

## Risks & Notes

- `rehype-pretty-code` 与 Typography 都会影响 `pre/code`，实现时要避免双重背景、双重 padding、双重颜色覆盖。
- 自动折行会改变部分代码块的视觉布局，适合博客阅读，但不完全等同于编辑器体验；本次以“阅读优先”作为主目标。
- 如果未来要加入复制按钮、代码块标题、指定行高亮，建议基于这次的 `rehype-pretty-code` 管线继续扩展，而不是再回退到纯 CSS 修补。
