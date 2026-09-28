# 260926-Stylelint 与 ESLint 自定义规则交付方案

## 一句话总结

这次不是单纯“加几个 lint 规则”，而是把当前项目已经形成的样式架构和书写习惯，逐步沉淀为一套可执行、可回归、可在 CI 中稳定运行的规则体系：**Stylelint 负责守住 `globals.css` 的设计边界，ESLint 负责约束 TSX 中 `className` 的组织方式。**

## 这份文档要解决什么问题

当前仓库已经有比较明确的样式约束，但还停留在“靠约定和人工记忆”阶段：

- `app/globals.css` 已经存在主题 token、`html[data-theme="dark"]`、`@custom-variant dark` 等明确设计；
- TSX 中大量使用 Tailwind 工具类，已经出现了通过常量拆分长 `className` 的倾向；
- 现有 Lint 体系只有 ESLint，没有 Stylelint，也没有项目级自定义样式规则。

这份方案的目标是把这些隐含约束收敛为明确交付：

- 哪些规则要做；
- 规则分别由 Stylelint 还是 ESLint 承担；
- 按什么顺序实施；
- 每个阶段交付什么；
- 什么状态才算完成。

## 当前项目基线

### 已有基础设施

- 包管理器：`pnpm`
- 框架：Next.js App Router
- 样式体系：Tailwind CSS v4 + 少量全局 CSS
- 现有 Lint：[`eslint.config.mjs`](file:///Users/dateng/my-blog/eslint.config.mjs)
- 现有全局样式入口：[`app/globals.css`](file:///Users/dateng/my-blog/app/globals.css)

### 当前样式结构判断

这个项目的样式主要分成两层：

1. `globals.css`
   - 主题 token
   - 深浅色主题切换入口
   - Mermaid / Lightbox 等全局类
   - Tailwind v4 指令与变体定义
2. `tsx` 中的 `className`
   - 大量 Tailwind utility
   - 部分组件已经开始把长 class 字符串提取为常量，例如 [`app/theme-toggle.tsx`](file:///Users/dateng/my-blog/app/theme-toggle.tsx)

因此规则职责应明确拆分：

- **Stylelint**：约束 `CSS` 本身的结构、主题入口和全局类边界
- **ESLint**：约束 `TSX/JSX` 中 `className` 的长度和组织方式

## 交付目标

本次完整交付包含两条主线。

### 主线 A：Stylelint 自定义规则

计划覆盖以下 5 条规则：

1. **禁止普通样式规则中写死颜色值**
   - 允许出现在 `:root` 和 `html[data-theme="dark"]` 这类主题 token 定义区
   - 禁止在普通 class 规则中直接出现 `#fff`、`rgb(...)`、`hsl(...)` 等颜色字面量
   - 目标是强制业务样式消费 token，而不是绕过主题系统

2. **禁止重新引入 `@media (prefers-color-scheme: dark)`**
   - 主题来源已经统一为 `ThemeProvider + html[data-theme="dark"]`
   - 这条规则用于避免再次出现第二套暗色入口

3. **禁止直接通过 `.dark` 选择器写主题覆盖**
   - Tailwind 的 `dark:` 已由 `@custom-variant` 统一接入
   - 纯 CSS 的暗色覆盖应统一落在 `html[data-theme="dark"]`

4. **限制全局类命名边界**
   - 只允许明确的领域前缀，例如 `mermaid-`、`diagram-lightbox`
   - 防止 `globals.css` 逐步退化成杂项样式收容器

5. **交互态规则：出现 `:hover` 时要求补齐 `:focus-visible`**
   - 用于守住键盘交互的一致性
   - 这条规则更适合作为后期进阶项，而不是第一批阻塞性规则

### 主线 B：ESLint 自定义规则

1. **限制 `className` 长度**
   - 面向 JSX / TSX 中的 `className="..."`、模板字符串或数组 `.join(" ")` 的场景
   - 超过阈值时要求提取常量、拆分状态类或使用更清晰的组织方式
   - 目标不是强迫“所有 class 都很短”，而是避免无边界增长导致可读性下降

## 不在本次范围内的事项

以下内容与本轮交付强相关，但不建议混进第一阶段：

- 自动修复所有自定义规则
- 对 Tailwind utility 排序做二次定制
- 对任意 JSX 表达式做复杂语义分析
- 把所有现有样式历史问题一次性全部清理完

原则是先建立**稳定可运行、误报可控、容易维护**的第一版规则体系，再考虑增强。

## 推荐的实现落点

### Stylelint

建议新增：

- `stylelint`
- 适配 Tailwind / 新语法所需的基础配置
- 本地自定义规则目录，例如：
  - `tools/stylelint-rules/`
  - `tools/stylelint-rules/no-raw-color-in-regular-rules.js`
  - `tools/stylelint-rules/no-prefers-color-scheme-dark.js`

建议补充脚本：

- `lint:css`
- `lint:css:fix`（仅基础规则可自动修复时启用）

### ESLint

建议在现有 [`eslint.config.mjs`](file:///Users/dateng/my-blog/eslint.config.mjs) 基础上增加本地自定义规则入口，例如：

- `tools/eslint-rules/`
- `tools/eslint-rules/max-classname-length.js`

建议补充脚本：

- `lint`
- `lint:all`，统一串起 `eslint` + `stylelint`

### 文档与验证

建议同步交付：

- 规则说明文档
- 每条规则的正例 / 反例
- 至少一组针对规则行为的自动化测试

## 实施顺序

为了降低首次接入成本，建议按照“先守架构主路径，再守细节体验”的顺序推进。

### Phase 1：基础设施接入

- 引入 Stylelint
- 跑通 `globals.css`
- 确认与 Tailwind v4 指令共存正常
- 建立自定义规则目录与测试骨架

### Phase 2：高收益、低歧义规则

- `禁止普通样式规则中写死颜色值`
- `禁止 prefers-color-scheme: dark`

这两条最能保护主题系统，而且误报空间相对小，适合作为第一批落地规则。

### Phase 3：项目定制边界规则

- `禁止直接写 .dark 主题覆盖`
- `限制全局类命名边界`

这两条规则更“像这个项目自己的规范”，需要在实现前先把允许列表和例外说清楚。

### Phase 4：交互与可读性增强

- `:hover` 配 `:focus-visible`
- ESLint `className` 长度限制

这一阶段更强调维护体验和质量一致性，可以放到前面几条稳定后再接入。

## 时间线

以下时间线以 **2 周 / 10 个工作日** 为建议基线，适合个人项目逐步推进，也方便中途调整阈值和例外。

### 第 1 周：完成 Stylelint 主干落地

**Day 1**

- 选定 Stylelint 技术方案
- 接入基础依赖与脚本
- 跑通对 `app/globals.css` 的扫描

**Day 2**

- 建立 Stylelint 自定义规则目录
- 建立最小测试样例
- 明确 token 定义区与普通规则区的判断标准

**Day 3**

- 实现 `禁止普通样式规则中写死颜色值`
- 补齐正例 / 反例测试

**Day 4**

- 实现 `禁止 prefers-color-scheme: dark`
- 补齐正例 / 反例测试

**Day 5**

- 联调基础配置
- 修正文档
- 评估误报与例外场景

### 第 2 周：完成项目定制规则与 ESLint 收口

**Day 6**

- 实现 `禁止直接写 .dark 主题覆盖`
- 明确允许的主题选择器白名单

**Day 7**

- 实现 `限制全局类命名边界`
- 明确允许前缀与例外策略

**Day 8**

- 实现 `:hover` 配 `:focus-visible`
- 只在误报可控时启用为 error，否则先降级为 warning

**Day 9**

- 实现 ESLint `className` 长度限制
- 明确阈值、例外和推荐重构方式

**Day 10**

- 串联 `lint-staged` / CI 使用策略
- 补齐最终文档、示例和验收记录

## 里程碑

### M1：基础设施可运行

完成标志：

- Stylelint 已接入仓库
- 能扫描 `app/globals.css`
- 不会因为 Tailwind v4 指令或现有语法直接崩溃
- 本地存在最小自定义规则骨架和测试入口

### M2：主题架构保护规则上线

完成标志：

- `禁止普通样式规则中写死颜色值` 可运行
- `禁止 prefers-color-scheme: dark` 可运行
- 两条规则都具备正例 / 反例
- 误报已通过项目真实文件验证

### M3：项目边界规则上线

完成标志：

- `.dark` 主题覆盖限制可运行
- 全局类命名约束可运行
- 允许名单和例外策略已文档化

### M4：体验规则与 JSX 约束上线

完成标志：

- `:hover` / `:focus-visible` 规则可运行
- ESLint `className` 长度限制可运行
- 至少一处现有代码已被该规则成功拦截并给出可理解提示

### M5：流程闭环建立

完成标志：

- 本地有统一脚本可执行全部检查
- CI 已接入检查链路，且只做 check 不做 fix
- 文档中已明确本地修复与 CI 校验的职责分工

## Definition of Done

以下标准全部满足，才算这次交付真正完成。

### 规则层面

- 所有目标规则都已实现
- 每条规则都有明确职责、限制范围和例外说明
- 每条规则至少具备一组正例和一组反例
- 错误提示语可读，能直接告诉维护者“为什么不允许这样写”

### 工程层面

- 仓库中已存在稳定的 Stylelint 与 ESLint 执行脚本
- 本地运行不会因为现有文件或框架语法频繁误报
- 新规则不会破坏现有 `pnpm`、Next.js、Tailwind v4 工作流

### 流程层面

- 提交前策略已明确：本地可自动修复的继续本地修复
- CI 策略已明确：只检查，不自动改代码
- 至少一次完整执行通过本地与 CI 两条链路验证

### 文档层面

- 有一份规则总览文档
- 有一份“如何新增 / 调整阈值 / 添加例外”的维护说明
- 有至少一个真实项目文件被用作验证样本并记录结论

## 验收标准

如果从“是否值得合并”角度看，可以用下面 5 条做最终验收：

1. `globals.css` 中的主题边界已经能被规则守住
2. 未来新增样式不能轻易绕过 token 和主题入口
3. TSX 中过长 `className` 能被 ESLint 拦下
4. 规则误报率在真实项目文件上可接受
5. 新同学只看文档就能理解为什么有这些规则

## 风险与应对

### 风险 1：Stylelint 对 Tailwind v4 新语法兼容性不稳定

应对：

- 先用最小样本验证 `@theme`、`@custom-variant`、`@plugin`
- 接入初期先只扫描 `app/globals.css`
- 不要一开始就把规则范围铺到所有 CSS 文件

### 风险 2：自定义规则误报过多

应对：

- 先做高歧义度低的规则
- 先用 warning 试跑，再升级为 error
- 每条规则都保留显式例外策略，不做隐式放行

### 风险 3：ESLint 的 `className` 长度规则过于机械

应对：

- 不直接按字符数粗暴判断，可优先考虑 utility 数量或组合复杂度
- 允许对常量、受控模板和特殊组件保留例外
- 错误信息中给出建议动作：提取常量、拆分状态类、封装组件

## 推荐的最终交付物清单

- Stylelint 配置文件
- ESLint 本地自定义规则配置
- `tools/stylelint-rules/*`
- `tools/eslint-rules/*`
- 规则测试文件
- `package.json` 中新增 lint 脚本
- 一份规则说明文档
- 一份维护者说明文档

## 建议的优先级结论

如果希望尽快产出第一版并拿到正反馈，推荐优先级如下：

1. Stylelint 基础接入
2. 禁止普通样式规则中写死颜色值
3. 禁止 `prefers-color-scheme: dark`
4. 禁止直接写 `.dark` 主题覆盖
5. 限制全局类命名边界
6. ESLint `className` 长度限制
7. `:hover` 配 `:focus-visible`

这个顺序的好处是：先把**主题系统最容易失控的入口**收住，再逐步延伸到可读性和交互一致性。
