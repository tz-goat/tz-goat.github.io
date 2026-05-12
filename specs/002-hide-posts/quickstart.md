# Quickstart: 隐藏/恢复博客文章

## 隐藏一篇文章

在目标文章的 frontmatter 中添加：

```yaml
hidden: true
```

发布后，该文章不会出现在首页/博客列表/标签聚合中，且访问其详情页会表现为未找到/不可用。

## 恢复公开

将 `hidden` 删除或改为：

```yaml
hidden: false
```

重新发布后，该文章会重新出现在公开入口中。
