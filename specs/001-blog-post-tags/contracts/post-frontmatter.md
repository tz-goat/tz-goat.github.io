# Contract: Post frontmatter (`posts/*.md`)

**Version**: 1.0.0 (001-blog-post-tags)  
**Consumer**: `lib/posts.ts`（gray-matter）

## Required keys

| Key | Type | Notes |
|-----|------|--------|
| `title` | string | 文章标题 |
| `date` | string | 建议 ISO 日期字符串，与现有一致 |
| `description` | string | 摘要 |
| `tags` | array of string | **至少一个**元素；每个元素为一个标签（作者侧写法） |

## Example

```yaml
---
title: "示例"
date: "2026-04-06"
description: "摘要"
tags:
  - "test"
  - "spec"
---
```

单标签：

```yaml
tags:
  - "test"
```

## URL 与展示

- 列表页、标签页链接使用 **规范化后的 tag slug**（见 data-model / 实现），不一定与 frontmatter 字符串逐字符相同（如大小写）。
- 站点 **canonical** 路径形式以 `next.config` 为准；当前默认 **无尾随斜杠** 的 `/tags/[tag]`（若全站启用 `trailingSlash`，则以配置为准，合约不强制斜杠）。

## 破坏性变更

- 在此合约之前，`tags` 不存在；上线本功能后 **所有** 文章必须带 `tags`，否则构建失败。
