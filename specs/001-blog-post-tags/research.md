# Research: Blog tags (001-blog-post-tags)

**Date**: 2026-04-06

## 1. Frontmatter 形状：`tags` 如何表达

**Decision**: 使用 YAML 数组，元素为字符串，例如 `tags: ["test", "spec"]`；单标签写 `tags: ["only-one"]`。不使用逗号分隔单字符串，避免与标签内含逗号歧义。

**Rationale**: gray-matter 原生支持数组；与 Hexo/常见静态博客一致；类型在 TS 侧为 `string[]`。

**Alternatives considered**:

- 单个字符串 `tags: test` — 多标签难扩展。
- `tag` 单数 + 重复键 — YAML 不友好。

## 2. Slug 规范化规则

**Decision**: 将每个标签字符串规范为 **URL segment**：

- `trim`，合并连续空白为单空格再处理。
- Unicode 可保留为路径段（Next 与浏览器支持 UTF-8 编码路径）；为简单起见 **v1** 可采用：转小写、空格/下划线 → `-`，移除非字母数字与连字符以外字符（仅 ASCII 标签）**或** 使用轻量 `slugify`（若引入依赖）；本计划默认 **优先 ASCII slug**（`test`、`spec-kit`），中文标签在 frontmatter 中写英文 slug，避免编码差异。

**Rationale**: 与 FR-007「单一规范化、不分裂」一致；减少静态托管对非 ASCII 路径的差异。

**Alternatives considered**:

- 完整 Unicode slug — 与 `output: export` + 各托管对 URL 编码行为需更多测试；可标为后续改进。

## 3. 按标签筛选与排序

**Decision**: `getPostsByTagSlug(slug)` 在构建期过滤 `getAllPosts()`（或内部统一解析）中 `tags` 规范化后包含该 slug 的项；按 `date` 字符串降序（与现有 `getAllPosts` 一致）。

**Rationale**: 数据量小，O(n) 扫描足够；无索引需求。

## 4. 静态导出与动态路由

**Decision**: `app/tags/[tag]/page.tsx` 使用 `generateStaticParams()`，参数为 **所有在至少一篇文章中出现的规范化 tag slug**；`dynamicParams = false`（Next 默认在静态导出上下文行为与显式关闭未列路径一致，以实际 Next 16 文档为准）。

**Rationale**: `output: "export"` 要求构建时枚举路径。

**Alternatives considered**:

- 为任意字符串生成页面 — 不可行（无限集合）。
- 放弃静态导出 — 用户未要求改部署模型。

## 5. 零标签门禁

**Decision**: 在聚合 `getAllPosts()` 时若某文件缺少 `tags` 或 `tags` 为空数组，**抛错**导致 `next build` 失败（或集中校验函数在构建入口调用）。开发体验：`next dev` 同样失败，迫使本地修正。

**Rationale**: 直接满足 spec User Story 3 与 FR-001。

**Alternatives considered**:

- 仅 warning — 不满足「阻止发布」语义。

## 6. 与 FR-008（未知 slug 200）的一致性

**Decision**: 在**纯静态导出**前提下，**无法**对「从未出现在 frontmatter 中的 slug」提供与「有标签但零篇」相同的 200 HTML。计划与 Complexity Tracking 已将其标为**平台约束**；内容侧通过仅为已用 slug 生成页面，保证已用 slug 行为正确。

**Rationale**: 技术现实与部署选择冲突时的明确记录。

**Alternatives considered**:

- 修订 spec — 可由产品后续决定；本阶段以 research 记录为主。
