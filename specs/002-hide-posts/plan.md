# Implementation Plan: 隐藏指定博客文章（保留源文件）

**Branch**: `002-hide-posts` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-hide-posts/spec.md`

## Summary

通过为 `posts/` 下的 Markdown 文章增加一个可选的可见性前置字段（“隐藏”），让文章在不删除源文件的前提下：
1) 不出现在任何公开列表/聚合中；2) 不能通过直链访问正文（表现为未找到/不可用）；3) 恢复公开后重新参与展示。

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js (per `@types/node` 20.x)  
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, gray-matter 4.x, remark 15.x, remark-html 16.x  
**Storage**: Repository filesystem (`posts/*.md`)  
**Testing**: No dedicated test runner configured; rely on TypeScript typecheck + ESLint, add minimal unit coverage only if low-friction  
**Target Platform**: Node.js server/build environment (Next.js)  
**Project Type**: Next.js App Router blog (static-ish content from repo)  
**Performance Goals**: 列表与文章页保持静态生成/缓存优先；不引入额外客户端负担  
**Constraints**: 不新增依赖；不改变文章文件所在目录；保持现有 frontmatter 校验策略默认不放宽  
**Scale/Scope**: 站点规模以几十到数百篇文章为主；每次构建会遍历 `posts/` 目录

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Aligned with `.specify/memory/constitution.md` (my-blog / Next.js):

- **G-001**: Feature stays within Next.js App Router idioms unless the plan documents an
  approved exception.
- **G-002**: New or moved blog post sources remain Markdown under repository-root `posts/`
  (no silent relocation to other trees).
- **G-003**: Performance approach (static/cached vs dynamic) is stated for user-facing pages
  this feature touches.
- **G-004**: Frontmatter or URL contract changes include migration/compat notes in the spec
  or plan.

Gate evaluation:
- G-001: PASS（继续使用 App Router，页面仍由 `app/` 下的 Server Components 读取 `lib/posts.ts`）
- G-002: PASS（文章仍为 `posts/*.md`，仅增加可选 frontmatter 字段）
- G-003: PASS（页面继续使用构建期/静态生成路径为主；隐藏/恢复需要重新构建发布生效）
- G-004: PASS（新增 `hidden` 可选字段，默认公开；不破坏既有文章 frontmatter）

Post-design re-check: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-hide-posts/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── page.tsx
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx
└── tags/
    └── [tag]/page.tsx

lib/
└── posts.ts

posts/
└── *.md
```

**Structure Decision**: 单 Next.js 工程；文章解析与聚合逻辑集中在 `lib/posts.ts`，页面从该模块读取并渲染。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.

## Phase 0: Outline & Research (Output: research.md)

- 选择“隐藏”字段名与默认行为，并形成对作者可操作的写法
- 确认隐藏对所有入口的影响面：首页、博客列表、标签页、静态路由参数、Metadata 生成
- 明确直链访问隐藏文章的表现：与不存在一致（not found）

## Phase 1: Design & Contracts (Outputs: data-model.md, contracts/*, quickstart.md)

- 数据模型：补充 `PostMeta` / frontmatter 中的 `hidden?: boolean`，默认 `false`
- 解析与过滤点：
  - 列表聚合：`getAllPosts()` 默认只返回公开文章
  - 标签聚合：基于公开文章生成 tag 集合与 tag 列表
  - 详情页：当 `hidden: true` 时表现为未找到/不可用
- 合同（对外行为约束）：
  - frontmatter 合同：新增字段、默认值、兼容性
  - 路由与可见性合同：哪些路径受影响，以及隐藏时的返回语义
- 快速上手：作者如何在 `.md` 文件里隐藏/恢复文章

## Phase 2: Implementation Outline (Tasks live in /speckit.tasks)

- 更新 `lib/posts.ts`：解析 `hidden` 并在聚合/详情中使用
- 更新受影响页面：
  - 首页、博客列表、标签页：依赖 `getAllPosts()` / `getPostsByTagSlug()` 的输出，确保隐藏文章不出现
  - `[slug]` 详情页：对隐藏文章触发 `notFound()`
  - `generateStaticParams()`：确保不为隐藏文章生成静态参数
- 校验：
  - `pnpm lint`、`pnpm build`
