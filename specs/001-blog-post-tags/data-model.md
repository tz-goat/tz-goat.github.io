# Data Model: Blog tags

**Feature**: 001-blog-post-tags  
**Date**: 2026-04-06

## Post（文章）

| 字段 | 类型 | 规则 |
|------|------|------|
| `slug` | string | 来自文件名（不含 `.md`），唯一 |
| `title` | string | frontmatter，必填 |
| `date` | string | frontmatter，必填，用于排序（与现有一致） |
| `description` | string | frontmatter，必填 |
| `tags` | string[] | frontmatter，**必填**，至少 1 个；展示与筛选前经规范化去重 |
| `contentHtml` | string | 仅详情接口；由 Markdown 渲染 |

**关系**：多对多 — 一篇文章多个 tag；同一 tag slug 对应多篇文章。

## Tag（标签）

逻辑实体，**不单独落盘**。由所有 Post 的 `tags` 规范化后 **union** 得到全局 tag slug 集合。

| 字段 | 类型 | 规则 |
|------|------|------|
| `slug` | string | 规范化后的稳定标识，用于 URL `/tags/[slug]` 与相等性比较 |

**约束**：

- 同一 Post 内重复 tag 字符串，规范化后相同则列表只计一次（与 spec Edge Cases 一致）。
- 跨 Post 同一 slug 合并为同一标签。

## 规范化函数（概念）

输入：作者写的单个标签字符串。  
输出：`slug`（用于 URL 与包含检测）。

实现细节见 `lib/posts.ts`（计划实现），规则摘要：

- 去首尾空白；中间空白折叠。
- 映射为 URL 安全 segment（项目选定规则与 [research.md](./research.md) 一致）。

## 校验

- 每个 `posts/*.md`：**必须**存在非空 `tags` 数组。
- 构建失败条件：缺字段、空数组、或解析后无有效标签。
