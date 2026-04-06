---
description: "Task list for 001-blog-post-tags (blog tags + tag pages)"
---

# Tasks: Blog post tags and tag pages

**Input**: Design documents from `D:\my-blog\specs\001-blog-post-tags\`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/post-frontmatter.md](./contracts/post-frontmatter.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: 规格未强制 TDD；以 `npm run lint` 与 `npm run build` 为主（见 Polish 阶段）。

**Organization**: 按用户故事优先级编排；**US3 的校验（T008）须在 `posts/*.md` 全部补全 tags（T007）之后执行**，否则构建会失败。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件、无未完成的前置依赖）
- **[Story]**: 仅用户故事阶段任务使用 [US1]、[US2]、[US3]

## Path Conventions

- 仓库根：`D:\my-blog\`
- 路由与逻辑：`app/`、`lib/posts.ts`
- 内容：`posts/*.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 确认现有静态导出配置仍适用于新动态段

- [x] T001 Confirm `D:\my-blog\next.config.ts` remains valid with new `app/tags/[tag]` static params (no change expected for `output: "export"`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `lib/posts.ts` 扩展标签模型与查询；**此阶段允许 `tags` 为空数组** 以便后续逐篇补全，直至 US3 开启强校验

**⚠️ CRITICAL**: 未完成 Phase 2 前不得实现用户故事页面

- [x] T002 Extend `D:\my-blog\lib\posts.ts`: add `tags: string[]` to `PostMeta`/`Post`, implement `normalizeTagSlug()`, parse YAML `tags` from frontmatter, dedupe tags per post
- [x] T003 Add `getAllTagSlugs()` and `getPostsByTagSlug(tagSlug: string)` to `D:\my-blog\lib\posts.ts` (filter + sort by `date` desc, same order as `getAllPosts`)
- [x] T004 Update `getPostBySlug()` in `D:\my-blog\lib\posts.ts` to return `tags` for article rendering

**Checkpoint**: 数据层可读出标签；首页/博客列表可先不展示标签（非本特性必须）

---

## Phase 3: User Story 1 — Browse posts by tag (Priority: P1) 🎯 MVP

**Goal**: `/tags/[tag]` 展示该标签下文章列表（日期降序）

**Independent Test**: `npm run dev`，访问某一存在于 frontmatter 中的 tag，列表与预期一致（参见 [quickstart.md](./quickstart.md)）

### Implementation for User Story 1

- [x] T005 [P] [US1] Create `D:\my-blog\app\tags\[tag]\page.tsx` with `generateStaticParams()` from `getAllTagSlugs()`, `generateMetadata`, and post list with links to `/blog/[slug]`

**Checkpoint**: MVP——仅有标签页即可演示按类浏览（可先只给部分文章加 tag 做联调）

---

## Phase 4: User Story 2 — Discover tags from an article (Priority: P2)

**Goal**: 文章详情展示可点击标签，链到 `/tags/[tag]`

**Independent Test**: 打开 `/blog/[slug]`，点击标签进入对应标签列表且包含当前文

### Implementation for User Story 2

- [x] T006 [P] [US2] Add tag link UI to `D:\my-blog\app\blog\[slug]\page.tsx` (use normalized slugs, `Link` to `/tags/[tag]`)

**Checkpoint**: P1+P2 读者路径闭环

---

## Phase 5: User Story 3 — Every post declares tags (Priority: P3)

**Goal**: 每篇发布内容至少一个 tag；构建期拒绝零标签

**Independent Test**: 故意去掉某篇 `tags` 后 `npm run build` 应失败；恢复后通过

### Implementation for User Story 3

- [x] T007 [US3] Add `tags` (at least one) to every `D:\my-blog\posts\*.md` per `D:\my-blog\specs\001-blog-post-tags\contracts\post-frontmatter.md`
- [x] T008 [US3] Enforce non-empty `tags` in `getAllPosts()` and `getPostBySlug()` in `D:\my-blog\lib\posts.ts` (throw with file/slug hint on violation)

**Checkpoint**: 与 spec FR-001 / User Story 3 对齐

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 质量门禁与快速验收

- [x] T009 Run `npm run lint` and `npm run build` at `D:\my-blog\`; fix any regressions
- [x] T010 Walk through `D:\my-blog\specs\001-blog-post-tags\quickstart.md` scenarios manually (dev + static export output if applicable)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **Phase 3 (US1)** → **Phase 4 (US2)** → **Phase 5 (US3)** → **Phase 6**
- **US3 (T007→T008)** MUST NOT run T008 before T007（内容未补全会失败）

### User Story Dependencies

- **US1** depends on Phase 2 (`getAllTagSlugs`, `getPostsByTagSlug`, `PostMeta.tags`)
- **US2** depends on Phase 2 (`getPostBySlug` exposes `tags`)
- **US3** depends on Phase 2（在 `lib` 中加校验）；**内容任务 T007 先于校验任务 T008**

### Parallel Opportunities

- After **T004** completes: **T005 [US1]** and **T006 [US2]** touch different files (`app/tags/[tag]/page.tsx` vs `app/blog/[slug]/page.tsx`) — may proceed in parallel if coordinated
- **T007** can be split per file with `[P]` only if multiple authors edit disjoint `posts/*.md` files (same phase, merge conflict risk — optional)

---

## Parallel Example: After T004

```text
Developer A: T005 [US1]  D:\my-blog\app\tags\[tag]\page.tsx
Developer B: T006 [US2]  D:\my-blog\app\blog\[slug]\page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. T001–T004（Foundation）
2. T005（US1 标签列表页）
3. **STOP**：用部分文章带 tag 验证 `/tags/[tag]`

### Full feature

4. T006（US2）
5. T007 → T008（US3 内容与强校验顺序不能反）
6. T009–T010（Polish）

### Notes

- [plan.md](./plan.md) 已说明 **静态导出** 下仅能为「内容中出现的 tag」预渲染；与 spec FR-008 任意 slug 200 的差异以计划为准，不在本任务列表重复实现。
