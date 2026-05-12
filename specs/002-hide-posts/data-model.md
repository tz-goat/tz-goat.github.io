# Data Model: 隐藏指定博客文章（保留源文件）

## Entity: Post (Markdown file under `posts/`)

### Identity

- Primary identity: `slug`（由文件名去掉 `.md` 得到）
- Uniqueness rule: `posts/<slug>.md` 必须唯一

### Frontmatter fields

- `title` (string, required)
- `date` (string, required)
- `description` (string, required)
- `tags` (string[] or string, required; 会被规范化为 ASCII tag slug)
- `hidden` (boolean, optional; `true` 表示隐藏；缺省视为 `false`)

### Derived fields

- `contentHtml`：由 Markdown 正文渲染得到

### Visibility state

- `hidden = false`（默认）：公开
- `hidden = true`：隐藏

### State transitions

- 公开 → 隐藏：发布后在公开入口不可见，详情页不可达（未找到/不可用）
- 隐藏 → 公开：重新出现在聚合入口，详情页可达
