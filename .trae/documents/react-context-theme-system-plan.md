# React Context 主题系统实现计划

## Summary

为当前博客补齐一个基于 React Context 的全局主题系统，支持 `light | dark | system` 三态模式，并在全站统一产出解析后的实际主题结果。首轮计划同时覆盖以下能力：

- 用户可在页面右上角切换主题
- 用户选择持久化到 `localStorage`
- 首屏在静态导出场景下尽量避免主题闪烁
- Mermaid 图表跟随手动主题切换重新渲染
- Shiki 代码高亮和正文样式不再只依赖系统主题，而是跟随站点实际主题

本次方案优先复用现有 CSS 变量和客户端增强链路，避免引入额外状态库。

## Current State Analysis

### 现有能力

1. 根布局 [app/layout.tsx](file:///Users/dateng/my-blog/app/layout.tsx) 目前只负责字体和全局样式引入，没有 Provider，也没有首屏主题注入脚本。
2. 全局样式 [app/globals.css](file:///Users/dateng/my-blog/app/globals.css) 已经建立了 `--background`、`--foreground`、代码块、行内代码等主题变量，并通过 `@theme inline` 映射给 Tailwind v4。
3. 页面样式广泛使用了 `dark:` 变体，例如：
   - [app/page.tsx](file:///Users/dateng/my-blog/app/page.tsx)
   - [app/blog/page.tsx](file:///Users/dateng/my-blog/app/blog/page.tsx)
   - [app/blog/[slug]/page.tsx](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/page.tsx)
   - [app/tags/[tag]/page.tsx](file:///Users/dateng/my-blog/app/tags/%5Btag%5D/page.tsx)
4. 文章内容客户端增强组件 [app/blog/[slug]/post-content.tsx](file:///Users/dateng/my-blog/app/blog/%5Bslug%5D/post-content.tsx) 里：
   - Mermaid 通过 `window.matchMedia("(prefers-color-scheme: dark)")` 决定主题
   - 图片放大通过 `medium-zoom` 完成
   - Mermaid 预览弹层状态已经与正文 HTML 渲染隔离，适合继续接入主题状态
5. Markdown 渲染链路 [lib/posts.ts](file:///Users/dateng/my-blog/lib/posts.ts) 中 `rehype-pretty-code` 已经同时输出亮色和深色主题 token（`github-light` / `github-dark`）。

### 当前缺口

1. 缺少一个全站共享的“主题真相来源”，现在 CSS、页面类名、Mermaid、Shiki 彼此没有统一状态。
2. 深色模式主要依赖 `prefers-color-scheme` 和 `dark:` 类名，用户无法主动覆盖系统主题。
3. 代码高亮深色 token 切换写在 `@media (prefers-color-scheme: dark)` 中，未来手动切换后会和站点主题脱节。
4. Mermaid 主题判断只依赖系统主题，无法响应站点内部主题切换。
5. 当前页面没有统一头部结构，但每个页面都有顶部空间，适合先放一个轻量按钮，不必为了切换入口先重构全局 Header。

## Assumptions & Decisions

1. **主题模式**：采用三态模型 `light | dark | system`。
2. **主题状态归属**：使用 React Context 承载，而不是 Zustand/Redux；因为这是低频、全站共享、纯展示偏好状态。
3. **DOM 同步策略**：在 `document.documentElement` 上写入：
   - `data-theme="light|dark"`：供 CSS 变量、代码高亮、第三方渲染读取
   - 可选同步 `class="dark"`：兼容项目内现有大量 `dark:` Tailwind 类，降低首轮改造量
4. **持久化**：主题模式持久化到 `localStorage`，键名固定为单一常量，避免散落硬编码。
5. **首屏体验**：在根布局内注入一段尽早执行的内联脚本，优先恢复已保存主题，并同步 `data-theme` / `dark` class，减少静态导出场景首屏闪烁。
6. **切换入口**：先在首页、博客列表页、文章详情页、标签页顶部右上角放同一套轻量按钮，不额外引入全局 Header 重构。
7. **Mermaid 联动**：`PostContent` 改为消费 `resolvedTheme`，在主题切换时重新初始化 Mermaid。
8. **代码高亮联动**：CSS 从基于系统媒体查询切换，改为基于 `html[data-theme="dark"]` 切换 Shiki token。

## Proposed Changes

### 1. 新增主题上下文与客户端 Provider

**文件**

- `app/theme-provider.tsx`（新增）

**要做什么**

- 新建客户端 `ThemeProvider`
- 暴露 `useTheme()` hook
- 维护：
  - `theme`: `"light" | "dark" | "system"`
  - `resolvedTheme`: `"light" | "dark"`
  - `setTheme(theme)`
  - `toggleTheme()`，用于两态快捷切换按钮逻辑

**为什么这样做**

- 让页面组件、客户端增强逻辑、切换按钮都从同一个状态源读取主题
- 保持博客未来扩展“阅读偏好”时的状态组织方式一致

**怎么做**

- 初始挂载时读取 `localStorage`
- 若为 `system`，订阅 `matchMedia("(prefers-color-scheme: dark)")`
- 当 `theme` 或系统主题变化时，计算 `resolvedTheme`
- 将 `resolvedTheme` 写入 `document.documentElement.dataset.theme`
- 同步维护 `document.documentElement.classList.toggle("dark", resolvedTheme === "dark")`
- 在文件顶部为导出的类型、Provider、hook 添加简洁 JSDoc

### 2. 根布局接入 Provider 与首屏主题预注入

**文件**

- `app/layout.tsx`

**要做什么**

- 用 `ThemeProvider` 包裹 `children`
- 在 `<html>` 或 `<body>` 之前插入首屏主题恢复脚本

**为什么这样做**

- 主题必须在应用最外层生效，保证所有页面和客户端组件拿到一致上下文
- 预注入脚本用于解决静态导出站点的首次渲染闪烁

**怎么做**

- 内联脚本只做极小职责：
  - 读 `localStorage`
  - 解析系统主题
  - 写入 `data-theme`
  - 同步 `dark` class
- 让 `<html>` 默认保留当前 `lang`
- 不在脚本里引入 React 逻辑，避免增加 hydration 复杂度

### 3. 全局样式从“系统媒体查询”切换到“站点主题属性”

**文件**

- `app/globals.css`

**要做什么**

- 保留现有 token 设计
- 将深色 token 覆盖从 `@media (prefers-color-scheme: dark)` 改为 `html[data-theme="dark"]`
- 将代码高亮的深色 token 选择也切到 `html[data-theme="dark"]`
- 增加主题切换按钮所需的少量公共样式（如果按钮主要用 Tailwind，则只保留必要兜底）

**为什么这样做**

- 用户手动切换时，CSS 变量和代码高亮必须直接服从站点实际主题，而不是系统主题

**怎么做**

- `:root` 继续保存亮色默认 token
- `html[data-theme="dark"]` 覆盖深色 token
- 亮色 Shiki token 规则保持基础态
- 深色 Shiki token 规则改为 `html[data-theme="dark"] .prose ...`
- 不强制清理现有页面中的 `dark:` 类；首轮通过同步 `dark` class 兼容

### 4. 新增轻量主题切换组件

**文件**

- `app/theme-toggle.tsx`（新增）

**要做什么**

- 新建客户端主题切换按钮
- 展示当前模式并允许切换到 `light / dark / system`

**为什么这样做**

- 这是用户感知主题系统的直接入口，也是练习 Context 消费的最佳位置

**怎么做**

- 采用简单可靠的交互形态：
  - 默认按钮显示当前解析主题
  - 点击后以轻量菜单或循环切换方式切换模式
- 结合当前项目规模，优先选择“按钮 + 小菜单”而不是额外引入 UI 库
- 组件内部消费 `useTheme()`
- 给导出组件添加 JSDoc，说明其职责与边界

### 5. 在现有页面顶部接入主题切换入口

**文件**

- `app/page.tsx`
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`
- `app/tags/[tag]/page.tsx`

**要做什么**

- 在每个页面的顶部区域增加一个右上角切换入口

**为什么这样做**

- 用户已选择“每页右上角”方案
- 这样能在不引入全局 Header 重构的前提下，让入口覆盖所有主要页面

**怎么做**

- 首页：放在博客标题区域的右侧
- 列表页 / 标签页 / 详情页：放在返回链接与标题区域附近，保持统一视觉节奏
- 维持现有内容宽度和排版，不扩大结构改动面

### 6. 让 Mermaid 跟随全局主题而不是系统主题

**文件**

- `app/blog/[slug]/post-content.tsx`

**要做什么**

- 让 `PostContent` 读取 `resolvedTheme`
- Mermaid 渲染 effect 依赖从 `[html]` 扩展为 `[html, resolvedTheme]`

**为什么这样做**

- 当前 Mermaid 只会跟随系统主题，不会响应用户在站内的手动切换
- 文章页是主题系统最容易露馅的地方，必须和正文其他部分保持一致

**怎么做**

- 在组件内部通过 `useTheme()` 获取 `resolvedTheme`
- 将 `mermaid.initialize({ theme: ... })` 改为基于 `resolvedTheme`
- 主题变化时重新扫描并重渲染 `data-mermaid="true"` 节点
- 保留现有 memo 和弹层状态隔离，避免主题接入破坏正文增强稳定性
- 为复杂 `useEffect` 继续保留 JSDoc 风格注释，重点解释为什么依赖主题重渲染

### 7. 验证代码高亮与正文视觉一致性

**文件**

- `app/globals.css`
- 可选参考：`posts/blog-diy.md`（仅用于人工验证页面）

**要做什么**

- 确认代码块、行内代码、Mermaid 卡片、Lightbox 在三种模式下视觉一致

**为什么这样做**

- 你的博客正文模块使用了多种消费主题变量的元素，主题系统是否完整主要看文章页是否一致

**怎么做**

- 以已有包含代码块和 Mermaid 的文章作为验证样本
- 验证亮色、深色、system 三态下：
  - 页面背景与正文文本正常
  - 代码高亮颜色正确
  - Mermaid 图与预览弹层不出现亮暗错位
  - 图片放大背景仍与主题设计一致

## Implementation Steps

1. 新增 `app/theme-provider.tsx`，实现主题状态、DOM 同步、持久化与导出 hook。
2. 新增 `app/theme-toggle.tsx`，实现三态切换 UI。
3. 更新 `app/layout.tsx`，接入 Provider 和首屏主题恢复脚本。
4. 更新 `app/globals.css`，将主题变量和 Shiki 深色规则切到 `html[data-theme="dark"]`。
5. 更新各页面顶部结构，接入 `ThemeToggle`。
6. 更新 `app/blog/[slug]/post-content.tsx`，让 Mermaid 消费 `resolvedTheme` 并在主题切换时重渲染。
7. 运行 lint，并在本地页面中手动验证三态切换表现。

## Verification Steps

### 自动验证

1. 运行 `pnpm lint`

### 手动验证

1. 启动开发环境后访问首页、博客列表页、标签页、文章详情页。
2. 切换 `light / dark / system`，确认页面背景、文字、按钮、标签样式立即更新。
3. 刷新页面，确认用户选择被保留。
4. 修改系统主题后，在 `system` 模式下确认页面自动跟随。
5. 打开包含 Mermaid 和代码块的文章，确认：
   - Mermaid 图表主题正确
   - 代码高亮颜色正确
   - Mermaid Lightbox 和图片放大背景无明显错位
6. 首次打开页面时观察是否有明显亮暗闪烁；若仍存在，再根据实际表现微调内联脚本和基础样式。

## Out of Scope

1. 不引入第三方主题库（如 `next-themes`）
2. 不在本轮重构统一全局 Header / 导航
3. 不把其他展示偏好（字体大小、阅读宽度、动效开关）一并接入同一个 Context
4. 不改动 Markdown 编译链路和文章数据结构
