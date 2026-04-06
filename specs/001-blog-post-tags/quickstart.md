# Quickstart: Tags（001-blog-post-tags）

## 1. 给现有文章加测试标签

编辑 `posts/` 下任意 `.md`，在 frontmatter 中增加 `tags`（至少一项），例如：

```yaml
tags:
  - "test"
```

保存后本地执行：

```bash
npm run build
```

构建应通过；若某篇仍无 `tags`，构建会失败并指向需修正的文件（取决于实现方式：抛错信息或校验脚本）。

## 2. 本地验证功能

```bash
npm run dev
```

- 打开某篇博文，应看到标签链接。
- 点击标签或访问 `/tags/test`（slug 以规范化结果为准），应看到带该标签的文章列表。

## 3. 后续你自己改标签

直接改对应 Markdown 的 `tags` 数组即可；标签集合变化后重新 `npm run build` 以更新静态导出页面。

## 4. 规格与合约

- 完整需求：[spec.md](../spec.md)
- frontmatter 字段：[contracts/post-frontmatter.md](../contracts/post-frontmatter.md)
