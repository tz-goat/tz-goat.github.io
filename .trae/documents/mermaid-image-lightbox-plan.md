# Mermaid 与图片放大预览计划

## Summary

为博客正文中的 Mermaid 图和 Markdown 图片补充“点击后弹层预览”的交互能力。目标体验参考常见技术博客：正文内保持当前排版尺寸，点击后打开遮罩层，居中展示更大的图表或图片，并支持关闭返回正文。

## Current State Analysis

- 文章正文当前由 [`app/blog/[slug]/page.tsx`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/page.tsx) 引入 [`app/blog/[slug]/post-content.tsx`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/post-content.tsx) 渲染。
- `post-content.tsx` 目前仅负责：
  - 将 `contentHtml` 注入到 `.prose` 容器中
  - 在 `useEffect` 里找到 `[data-mermaid="true"]` 节点
  - 用 `mermaid.render()` 把 Mermaid 源码替换成内嵌 SVG
- Mermaid 图当前只是普通内嵌 SVG，没有任何点击预览、键盘关闭或遮罩层逻辑。
- 全局 Mermaid 样式位于 [`app/globals.css`](file:///Users/dateng/my-blog/app/globals.css) 的 `.mermaid-diagram` 相关规则，只负责边框、留白、滚动和失败回退。
- 正文图片当前直接来自 Markdown 生成的 `<img>`，仓库中已存在实际用法，例如 [`posts/file-interaction-review.md`](file:///Users/dateng/my-blog/posts/file-interaction-review.md) 的 `/img/file-0813/*.jpeg`。
- 当前项目没有现成的通用弹层/Lightbox 组件，也没有图片预览逻辑。

## Proposed Changes

### 1. 在 `post-content.tsx` 内增加统一的预览状态管理

文件：[`app/blog/[slug]/post-content.tsx`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/post-content.tsx)

改动内容：

- 将当前仅有 `containerRef` 的实现扩展为“正文渲染 + 预览弹层控制”。
- 新增本地状态，用于记录当前打开的预览内容：
  - 类型：`mermaid` 或 `image`
  - 标题/替代文本：优先使用图片 `alt`，Mermaid 用固定说明文本
  - 预览数据：
    - Mermaid：渲染后的 SVG 字符串
    - 图片：图片 `src`
- Mermaid 渲染完成后，为每个 `.mermaid-diagram`：
  - 增加可点击语义（如 `role="button"`、`tabIndex`、`aria-label`）
  - 绑定点击事件，点击后把当前 SVG 内容送入预览状态
- 对正文内 `<img>` 元素：
  - 在 `useEffect` 中查找并绑定点击事件
  - 点击时读取 `src` / `alt`，打开图片预览
- 增加统一关闭逻辑：
  - 点击遮罩或关闭按钮关闭
  - `Escape` 关闭
  - 卸载时清理事件监听

原因：

- 当前正文已经是客户端组件，继续在这里集中管理交互，改动范围最小。
- Mermaid 和图片共享同一个 Lightbox，可避免后续维护两套弹层逻辑。

### 2. 在 `post-content.tsx` 中渲染通用 Lightbox 结构

文件：[`app/blog/[slug]/post-content.tsx`](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/post-content.tsx)

改动内容：

- 在正文容器后追加一个条件渲染的弹层：
  - 全屏遮罩
  - 居中预览内容区域
  - 关闭按钮
  - 可选标题/说明文本
- 预览内容按类型分流：
  - `mermaid`：通过 `dangerouslySetInnerHTML` 注入已渲染的 SVG
  - `image`：使用普通 `<img>` 渲染大图，保留 `alt`
- 弹层内容区域应阻止冒泡，避免点击内容本身误触关闭。

原因：

- 用户明确希望“类似其他博客网站那种点击放大”的体验，弹层预览是最贴近的交互。
- 直接复用当前客户端组件，避免新增跨层通信。

### 3. 补充正文中 Mermaid 与图片的可点击样式

文件：[`app/globals.css`](file:///Users/dateng/my-blog/app/globals.css)

改动内容：

- 为 `.mermaid-diagram` 增加交互提示：
  - `cursor: zoom-in`
  - 悬浮时轻微阴影/边框变化
  - 聚焦态可见 outline
- 为正文图片（限制在 `.prose` 内）增加：
  - `cursor: zoom-in`
  - 合理的圆角/边框/悬浮反馈
  - `max-width: 100%`
- 新增 Lightbox 样式：
  - 遮罩层定位、层级和背景
  - 居中内容区域的最大宽高
  - SVG / 图片在视口内自适应缩放
  - 关闭按钮样式
  - 小屏幕下留足边距，避免贴边

原因：

- 当前图和图片没有任何“可点击放大”的视觉暗示。
- Lightbox 需要独立样式，不能混在 `.prose` 排版规则里。

### 4. 保持 Mermaid 现有渲染链路不变，只在渲染完成后附加预览能力

文件：[`lib/posts.ts`](file:///Users/dateng/my-blog/lib/posts.ts)

改动内容：

- 不调整当前 `rehypeMermaidBlocks` 的核心职责。
- 保持 Mermaid 在服务端阶段仍然只被转换为 `data-mermaid="true"` 的占位容器。

原因：

- 当前 Mermaid 渲染链路已经工作正常，问题只在交互层。
- 避免为了放大预览重构 Markdown 渲染流程。

## Assumptions & Decisions

- 交互形式已确定为：**弹层预览**。
- 范围已确定为：**Mermaid 图 + 正文图片** 都支持点击放大。
- 预览只要求“点击放大查看”，本次不扩展为拖拽平移、滚轮缩放、缩略图导航或多图画廊。
- 图片继续沿用当前 Markdown 输出的 `<img>`，不改成 `next/image`，以避免与 `dangerouslySetInnerHTML` 的现有链路冲突。
- Mermaid 预览使用“点击当前正文中的已渲染 SVG”方式，不额外二次生成下载文件或单独路由。
- 若 Mermaid 渲染失败并回退为源码文本，则不提供图表预览，只保留普通文本显示。

## Verification Steps

1. 运行 `pnpm exec tsc --noEmit`，确认客户端状态和事件处理无类型错误。
2. 运行 `pnpm exec eslint app/blog/[slug]/post-content.tsx app/globals.css`，确认新增交互代码和样式无 lint 问题。
3. 运行 `pnpm build`，确认静态导出仍然通过，Mermaid 渲染链路未受影响。
4. 手动验证 [`/blog/file-interaction-review`](file:///Users/dateng/my-blog/posts/file-interaction-review.md)：
   - 点击 Mermaid 图可打开弹层
   - 弹层内图表尺寸明显大于正文
   - 点击遮罩、关闭按钮、按 `Esc` 都能关闭
   - 点击正文图片也能打开弹层
   - 关闭后能回到原阅读位置
5. 手动抽查无 Mermaid 的普通文章页面，确保正文排版和普通代码块不受影响。
