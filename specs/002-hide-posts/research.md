# Research: 隐藏指定博客文章（保留源文件）

## Decision 1: Frontmatter 字段与默认行为

- Decision: 使用 `hidden: true` 表示隐藏；未设置时默认公开
- Rationale: 对作者最直观；默认公开避免现有文章被“误隐藏”
- Alternatives considered:
  - `draft: true`：语义更偏“草稿”，但需求是“不可显示”，且可能与未来草稿功能混淆
  - `published: false`：需要双值字段，容易出现否定逻辑与可读性问题

## Decision 2: 直链访问隐藏文章的表现

- Decision: 隐藏文章对访客表现为未找到/不可用（等价于 not found）
- Rationale: 最小化内容泄露面；与“隐藏即不暴露”的期望一致；验收标准最清晰
- Alternatives considered:
  - 显示“无权限”：会暴露资源存在与访问语义
  - 重定向到首页：对用户不透明，且不利于自动化验收

## Decision 3: 影响面与入口清单

- Decision: 影响所有面向访客的入口，包括：
  - 首页最新文章
  - `/blog` 全部文章列表
  - `/tags/[tag]` 标签聚合列表
  - 文章详情 `/blog/[slug]`
  - 静态路由参数生成（隐藏文章不生成）
- Rationale: 防止“只隐藏列表但仍可被聚合/静态参数暴露”
- Alternatives considered:
  - 仅隐藏列表：存在可见性漏洞（直链、标签聚合、静态参数）
