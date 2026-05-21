---
 
 description: "Tasks for implementing hidden posts (keep source files)"
---
 
 # Tasks: 隐藏指定博客文章（保留源文件）
 
 **Input**: Design documents from `/specs/002-hide-posts/`
 **Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
 **Tests**: Not requested (lint + build verification only)
 
 ## Phase 1: Setup (Shared Infrastructure)
 
 **Purpose**: 对齐实现前置条件与影响面，确保后续任务可独立验收
 
- [ ] T001 确认当前分支为 `002-hide-posts`，并拉起本地环境用于验收（运行 `pnpm dev`，repo root `package.json`）
- [x] T002 盘点受影响入口并记录在任务上下文：`app/page.tsx`、`app/blog/page.tsx`、`app/tags/[tag]/page.tsx`、`app/blog/[slug]/page.tsx`、`lib/posts.ts`
- [x] T003 [P] 准备一篇用于验收的隐藏文章：在 `posts/<slug>.md` frontmatter 增加 `hidden: true`
 
 ---
 
 ## Phase 2: Foundational (Blocking Prerequisites)
 
 **Purpose**: 在内容解析层引入“可见性”能力，供所有页面复用
 
 **⚠️ CRITICAL**: User Story 阶段任务依赖本阶段完成
 
- [x] T004 在 `lib/posts.ts` 为 `PostMeta` 增加 `hidden: boolean` 字段（缺省为 `false`）
- [x] T005 在 `lib/posts.ts` 的 frontmatter 解析中读取 `hidden`（允许缺省；当为 truthy 时视为隐藏）
- [x] T006 在 `lib/posts.ts` 的 `getAllPosts()` 默认过滤隐藏文章（仅返回公开文章）
- [x] T007 在 `lib/posts.ts` 的 `getAllTagSlugs()` 基于公开文章生成 tag 集合（避免隐藏文章导致生成多余 tag 页面）
- [x] T008 在 `lib/posts.ts` 的 `getPostsByTagSlug()` 确保只返回公开文章（即使未来内部实现变更也不泄露）
- [x] T009 在 `lib/posts.ts` 的 `getPostBySlug()` 读取到 `hidden: true` 时抛出错误（由路由层 `notFound()` 处理）
 
 **Checkpoint**: `lib/posts.ts` 能区分公开/隐藏文章，且隐藏文章不会出现在任何聚合结果中
 
 ---
 
 ## Phase 3: User Story 1 - 访客仅能看到公开文章 (Priority: P1) 🎯 MVP
 
 **Goal**: 首页与博客列表不展示隐藏文章
 
 **Independent Test**: 准备至少 1 篇隐藏文章后，访问 `/` 与 `/blog`，隐藏文章不出现在列表中；其他文章正常展示
 
- [ ] T010 [P] [US1] 验证 `app/page.tsx` 首页“最新文章”列表不会展示隐藏文章（依赖 `getAllPosts()` 输出）
- [ ] T011 [P] [US1] 验证 `app/blog/page.tsx` 博客列表不会展示隐藏文章（依赖 `getAllPosts()` 输出）
 
 **Checkpoint**: 仅完成 US1 仍可独立演示：隐藏文章不会出现在主要列表入口
 
 ---
 
 ## Phase 4: User Story 2 - 维护者无需删除文件即可隐藏/恢复文章 (Priority: P2)
 
 **Goal**: 通过 frontmatter 可逆地隐藏/恢复文章，且不删除源文件
 
 **Independent Test**: 将同一篇文章的 `hidden` 在 `true/false/缺省` 间切换并重新启动/重新构建，验证其在列表与详情页的可见性随之变化
 
- [x] T012 [US2] 补充 `specs/002-hide-posts/quickstart.md` 验证步骤：如何设置 `hidden: true` 与恢复（确保与当前实现一致）
- [ ] T013 [US2] 验证未设置 `hidden` 的文章默认公开（至少抽查 1 篇未设置的旧文章在 `/blog` 可见）
- [ ] T014 [US2] 验证设置 `hidden: false` 与删除 `hidden` 字段行为一致（两者都应公开）
 
 ---
 
 ## Phase 5: User Story 3 - 隐藏文章不可通过直接链接被访问 (Priority: P3)
 
 **Goal**: 访客无法通过 `/blog/[slug]` 直链访问隐藏文章正文内容（表现为未找到/不可用）
 
 **Independent Test**: 访问一篇隐藏文章的 `/blog/<slug>`，页面触发 notFound，不渲染正文；公开文章不受影响
 
- [x] T015 [US3] 更新 `app/blog/[slug]/page.tsx` 的 `generateStaticParams()`：只为公开文章生成 params（依赖 `getAllPosts()` 过滤）
- [x] T016 [US3] 确认 `app/blog/[slug]/page.tsx` 在 `getPostBySlug()` 抛错时会执行 `notFound()`（隐藏文章与不存在文章表现一致）
- [ ] T017 [US3] 手工验收：访问隐藏文章详情页不展示正文（验证 `dangerouslySetInnerHTML` 不会被执行到）
 
 ---
 
 ## Phase 6: Polish & Cross-Cutting Concerns
 
 **Purpose**: 确保质量门禁与契约文档与实现一致
 
- [ ] T018 [P] 对齐契约文档：更新 `specs/002-hide-posts/contracts/frontmatter.md` 与 `specs/002-hide-posts/contracts/routing.md`（如实现细节有偏差则调整文档）
- [ ] T019 运行质量门禁：运行 `pnpm lint`（repo root `package.json`）
- [ ] T020 运行构建门禁：运行 `pnpm build`（repo root `package.json`）
 
 ---
 
 ## Dependencies & Execution Order
 
 - Phase 1 → Phase 2 → (US1 / US2 / US3) → Polish
 - US1/US2/US3 均依赖 Phase 2（`lib/posts.ts` 可见性能力）
 - US1 与 US3 可并行推进（页面改动在不同文件），US2 多为验收与文档对齐
 
 ## Parallel Opportunities
 
- T003（准备隐藏文章）可与 T001/T002 并行
- T018（文档对齐）可在功能稳定后并行补齐
 
 ## MVP Scope
 
 - MVP = Phase 1 + Phase 2 + US1（首页与 `/blog` 不展示隐藏文章）
