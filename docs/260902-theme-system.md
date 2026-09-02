# 260902-React Context 主题系统说明

## 一句话总结

这套主题系统的核心思路是：
- 用 `ThemeProvider` 维护全局主题状态，
- 用 `resolvedTheme` 统一产出最终亮暗结果，
- 再把结果同步到 `html` 上，让脚本、Tailwind、CSS 变量和客户端增强逻辑都消费同一份主题真相。

## 这份文档解决什么问题

这次主题升级跨了几层实现：

- `layout.tsx` 里的首屏初始化脚本
- `theme-provider.tsx` 里的 Context 状态管理
- `theme-toggle.tsx` 里的交互入口
- `globals.css` 里的 CSS 变量和 Tailwind 深色变体
- `post-content.tsx` 里的 Mermaid / 图片放大主题联动

如果只看单个文件，很容易看懂局部，但串不起来“为什么这样设计”。这份文档就是为了补齐这层维护语境。

## 关键文件职责

- `app/layout.tsx`
  - 装配全局主题能力
  - 在 React 接管前执行首屏主题初始化脚本
  - 挂载全局 `ThemeToggle`
- `app/theme-provider.tsx`
  - 保存 `theme`
  - 计算 `resolvedTheme`
  - 监听系统主题变化
  - 同步 `data-theme` / `.dark` / `color-scheme`
- `app/theme-toggle.tsx`
  - 消费主题上下文
  - 提供手动切换入口
- `app/globals.css`
  - 维护主题 token
  - 定义 Tailwind `dark:` 的触发方式
  - 控制代码块、行内代码、Mermaid、Lightbox 的主题外观
- `app/blog/[slug]/post-content.tsx`
  - 让 Mermaid 和图片放大层跟随 `resolvedTheme`

## 为什么首屏初始化用 script，而不是 hook

### 结论

因为 `hook` 执行得太晚，无法解决首次渲染闪烁；`script` 的职责是“在 React 接管前先把主题写到 DOM”。

### 如果只用 hook，会发生什么

像 `useEffect` 这样的 hook，要等到：

1. 服务端 HTML 输出完成
2. 浏览器先把页面画出来
3. React 在客户端完成 hydrate
4. hook 才开始执行

这意味着如果用户上次保存的是深色主题，页面很可能会：

1. 先按默认亮色渲染
2. 再在 hook 执行后切成深色

用户会看到明显闪烁。

### script 在这里的职责

`app/layout.tsx` 里的 `themeInitScript` 负责在浏览器第一次绘制前：

- 读取 `localStorage`
- 解析 `system` 模式对应的实际主题
- 先把结果写到 `document.documentElement`

具体写入这三项：

- `data-theme`
- `.dark` class
- `color-scheme`

这样第一次绘制时，页面就已经带着正确主题了。

### 分工原则

- `script`：解决首屏时机问题
- `ThemeProvider`：解决 React 生命周期内的状态管理问题

它们是接力关系，不是二选一。

## 为什么主题状态用 Context

### 结论

因为主题是一个**低频更新、全站共享、跨组件消费的 UI 偏好状态**，很适合放进 React Context。

### 这个项目里主题状态的特征

主题需要被多个不同层级的模块使用：

- 全局切换按钮
- 页面容器
- Mermaid 渲染逻辑
- 图片放大层
- CSS / Tailwind 深色样式

但它又不是高频业务状态，不需要引入 Zustand、Redux 这种额外状态库。

### 为什么不直接放在某个页面里

如果主题只保存在页面组件里：

- 新页面默认拿不到这份状态
- 切换按钮只能影响当前页面
- Mermaid、Lightbox 这类客户端增强逻辑不好共享同一份主题结果

而 Context 的意义就是：

**让所有子组件都能消费同一份主题状态，而不是各自维护一份。**

## 为什么要区分 theme 和 resolvedTheme

### 结论

因为 `theme` 表示“用户选择的策略”，而 `resolvedTheme` 表示“页面最终实际渲染的亮暗结果”。这两个概念不能混在一起。

### 两者分别是什么

`theme` 的取值：

- `light`
- `dark`
- `system`

`resolvedTheme` 的取值：

- `light`
- `dark`

### 为什么不能只保留一个变量

因为 `system` 不是一种颜色，而是一种策略。

例如：

- 用户选了 `theme = "system"`
- 当前系统是深色
- 那么页面真正应该显示的是 `resolvedTheme = "dark"`

如果不拆开：

- CSS 不知道该怎么处理 `system`
- Mermaid 不知道该用什么主题
- 图片放大层也不知道背景该用亮还是暗

所以这里必须拆成两层：

- `theme`：记录用户的选择
- `resolvedTheme`：提供给页面真正消费

## 为什么要支持 system

`system` 的意思不是第三种颜色，而是：

**“我不手动指定，页面跟随操作系统当前的主题偏好。”**

它的价值有两个：

1. 用户体验更完整
   - 默认跟随设备
   - 只有在用户明确想覆盖时才切成 `light` / `dark`
2. 状态语义更清晰
   - “策略” 和 “结果” 可以被分层表达

## 时间线：各模块的执行顺序和职责

下面是一次页面加载时的关键链路。

### 1. 浏览器拿到服务端输出的 HTML

这时 React 还没有接管页面，只是拿到了静态内容骨架。

### 2. `themeInitScript` 先执行

位置：`app/layout.tsx`

职责：

- 读取 `localStorage` 里的 `theme`
- 如果是 `system`，通过 `matchMedia("(prefers-color-scheme: dark)")` 算出实际亮暗
- 立刻把结果写到 `html`

产物：

- `html[data-theme="light|dark"]`
- `html.dark`（深色时）
- `html.style.colorScheme`

### 3. 浏览器第一次绘制页面

位置：`app/globals.css`

职责：

- 根据 `data-theme` 决定 CSS 变量
- 根据 `.dark` 决定 Tailwind 的 `dark:*`

这一步决定页面第一次被用户看到时长什么样。

### 4. React hydrate

React 接管页面后，`ThemeProvider` 开始生效。

### 5. `ThemeProvider` 建立主题状态

位置：`app/theme-provider.tsx`

职责：

- 初始化 `theme`
- 初始化 `systemTheme`
- 计算 `resolvedTheme`
- 监听系统主题变化
- 持久化用户策略
- 继续维护 DOM 上的 `data-theme` / `.dark`

### 6. `ThemeToggle` 消费上下文

位置：`app/theme-toggle.tsx`

职责：

- 展示当前策略和当前实际主题
- 调用 `setTheme` / `toggleTheme`

### 7. 正文增强逻辑消费 `resolvedTheme`

位置：`app/blog/[slug]/post-content.tsx`

职责：

- Mermaid 根据 `resolvedTheme` 决定 `default` 还是 `dark`
- 主题变化时重新渲染 Mermaid
- 图片放大层背景跟随当前主题变化

## custom-variant 的作用是什么

### 结论

`@custom-variant dark (&:where(.dark, .dark *));` 的作用是：**把 Tailwind 的 `dark:` 触发条件改成“祖先节点存在 `.dark` class”，而不是继续绑定系统媒体查询。**

### 为什么它是必须的

项目里很多页面类名都写成了：

```tsx
<div className="bg-white dark:bg-black" />
```

但 `dark:bg-black` 不是“看到 dark 就自动生效”，它依赖 Tailwind 对 `dark` 变体的定义。

如果不显式改掉，`dark:*` 仍然可能继续按默认深色媒体查询工作。这样就会出现：

- CSS 变量已经跟随手动主题切换了
- 但 `dark:bg-black` 这种类还在跟系统主题走

页面表现就会割裂。

### 加上之后发生了什么

由于 `ThemeProvider` 会在 `html` 上维护 `.dark`：

```ts
root.classList.toggle("dark", resolvedTheme === "dark");
```

而 `@custom-variant dark (...)` 又把 Tailwind 的 `dark:` 绑定到了 `.dark` class，
所以现在这条链路就通了：

1. `ThemeProvider` 切换主题
2. `html` 上增删 `.dark`
3. Tailwind 的 `dark:*` 跟着生效

### 你可以这样记

- `data-theme`：给 CSS 变量和显式主题规则用
- `.dark`：给 Tailwind 的 `dark:*` 用

两者都来自同一份 `resolvedTheme`，只是服务于不同消费方。

## 维护时的判断准则

以后如果继续升级主题系统，优先遵守这几个原则：

1. 不要让不同模块各自重新判断系统主题
   - 优先统一消费 `resolvedTheme`
2. 不要让 CSS、Tailwind、JS 渲染逻辑各自维护一套主题真相
   - DOM 上的 `data-theme` / `.dark` 应该始终来自 `ThemeProvider`
3. 首屏体验相关逻辑优先放在 `layout.tsx` 的初始化脚本
   - 不要把“防闪”逻辑挪回普通 hook
4. 当新模块需要主题时，先问它属于哪种消费者
   - CSS 变量消费者
   - Tailwind `dark:*` 消费者
   - 直接读 `resolvedTheme` 的 JS 消费者

## 常见误区

### 误区 1：ThemeToggle 自己在管理主题

不是。`ThemeToggle` 只是控制器，真正的状态在 `ThemeProvider`。

### 误区 2：`system` 是第三种颜色

不是。`system` 是策略，不是最终渲染结果。

### 误区 3：既然已经有 Context，就不需要首屏 script

不对。Context 解决的是 React 生命周期内的状态共享，不能替代首次渲染前的主题预注入。

### 误区 4：CSS 变量已经切好了，`dark:*` 自然会一起切

不一定。Tailwind `dark:*` 是否生效，取决于 `dark` 变体怎么定义。

## 后续如果再扩展

这套结构可以继续容纳类似的全局展示偏好，例如：

- 阅读宽度
- 字体大小
- 动效开关

但建议和主题一样，继续遵守“策略值”和“最终消费结果”分层的思路，避免把所有 UI 偏好都塞成一坨状态。
