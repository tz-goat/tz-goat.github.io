# Implementation Plan: Blog post tags and tag pages

**Branch**: `001-blog-post-tags` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-blog-post-tags/spec.md`  
**Plan input (user)**: 在已有网页基础上增加 tag 特性；现有 Markdown 可先加测试用 tag，后续再自行修改。

**Note**: This file is produced by `/speckit.plan`.

## Summary

在现有 Next.js（App Router）+ `posts/*.md` + `gray-matter` 的博客上，为 frontmatter 增加 **`tags`（至少一项）**，在内存/构建期建立「文章 ↔ 标签 slug」关系；新增路由 **`/tags/[tag]`** 展示该标签下文章列表（日期降序，与现有一致）；文章详情页展示可点击标签链接。标签 slug 由统一函数规范化（小写、连字符等），保证 URL 与比对一致。

存量文章由作者在本次改动中至少补一个测试标签（如 `test`），**`next build` 时对缺标签文章失败**，满足「零标签门禁」。

**静态导出约束**：仓库已启用 `output: "export"`。构建时仅为 **至少在某一篇文章 frontmatter 中出现过的** 标签 slug 生成 `/tags/[tag]` 页面；未参与构建的任意路径在静态托管上通常表现为 **404**，与 spec FR-008「任意路径均 200」在**任意字符串**层面无法同时满足。本计划将该项记入 **Complexity Tracking**；若将来必须严格 FR-008，需改为非纯静态托管方案或单独论证（见 [research.md](./research.md)）。

## Technical Context

**Language/Version**: TypeScript 5.x / Node 20+（与 `@types/node` 一致）  
**Primary Dependencies**: Next.js 16.1.6，React 19，gray-matter，remark，remark-html，Tailwind CSS 4  
**Storage**: 文件系统 `posts/*.md`（无数据库）  
**Testing**: ESLint；可选对 `lib/posts.ts` 内纯函数（slug 规范化、按标签过滤）做单元测试（Jest/Vitest 未在仓库中配置时以 `npm run build` + 手工验收为主）  
**Target Platform**: 现代浏览器；静态导出站点（如 GitHub Pages）  
**Project Type**: 静态站点（Next `output: "export"`）  
**Performance Goals**: 标签列表与现博客列表同为构建期生成 HTML，无额外客户端重逻辑  
**Constraints**: 文章不迁出 `posts/`；不引入 CMS；尽量少新依赖（slug 逻辑可自写）  
**Scale/Scope**: 个人博客量级（数十篇级）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Aligned with `.specify/memory/constitution.md` (my-blog / Next.js):

- **G-001**: ✅ 仅使用 App Router、`app/` 下新增 `tags/[tag]/page.tsx`，不引入第二框架。
- **G-002**: ✅ 正文仍在 `posts/*.md`；仅扩展 frontmatter。
- **G-003**: ✅ 标签页与文章页均为 SSG（`generateStaticParams` + 构建期读盘），符合静态导出与性能原则。
- **G-004**: ✅ frontmatter 新增 `tags` 字段与 URL `/tags/[tag]`；迁移说明见 [quickstart.md](./quickstart.md) 与 [contracts/post-frontmatter.md](./contracts/post-frontmatter.md)。

**Post-design re-check**: 数据模型与合约已落地；静态导出与 FR-008 任意 slug 的差异已在 **Complexity Tracking** 记录，不构成对 G-001–G-004 的违背。

## Project Structure

### Documentation (this feature)

```text
specs/001-blog-post-tags/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── post-frontmatter.md
└── tasks.md              # /speckit.tasks — not created by this command
```

### Source Code (repository root)

```text
posts/
├── *.md                  # frontmatter 增加 tags（至少一个）
app/
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx   # 展示标签链接
├── tags/
│   └── [tag]/page.tsx    # 按标签列表
lib/
└── posts.ts              # PostMeta 扩展 tags、getPostsByTag、getAllTagSlugs、校验
next.config.ts
```

**Structure Decision**: 单仓 Next 应用；逻辑集中在 `lib/posts.ts`，页面仅负责取数与展示。不新增 `src/` 目录以保持与现有布局一致。

## Complexity Tracking

> **FR-008 与 `output: "export"`**：规范要求任意符合模式的 `/tags/{slug}/` 均返回可浏览成功页。静态导出仅为 `generateStaticParams` 返回的标签生成文件；**从未出现在任何文章中的 slug** 在静态托管上一般为 **404**，无法在纯静态方案下保证 200。  
> **取舍**：保留静态导出（现有部署假设）；实现上保证「所有**内容中存在的**标签 slug」均有列表页且空列表语义正确；任意字符串的 200 响应列为**已知限制**，若未来强需求则评估 SSR/Edge 或修订 spec。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| FR-008 任意 slug 200 vs 静态导出 | 当前仓库已选静态托管路径 | 去掉 `output: "export"` 或加服务器组件运行时会影响部署模型 |
