# 260917-格式化、Lint、提交流程与 CI 学习总结

## 一句话总结

这次调整的核心不是“多记几个工具配置”，而是先建立一条稳定的工程化闭环：

- 本地保存时能自动格式化和自动修复；
- 提交前能拦住低成本问题；
- CI 能作为最终裁判统一收口；
- 对自动导入这类提效能力保持克制，优先基础设施稳定。

## 本次主要问题

### 1. `formatOnSave` 打开了，但保存时没有自动格式化

#### 现象

`test.js` 中的代码保存后没有被自动整理，原本以为是代码已经符合规则，实际并不是。

#### 原因

- 项目已经安装了 `prettier`，而且命令行运行后代码会发生变化；
- 问题不在代码本身，而在编辑器保存时没有真正调用到 `Prettier`；
- `editor.formatOnSave: true` 只表示“保存时尝试格式化”，不等于“一定由 Prettier 格式化”。

#### 解决方案

- 安装并启用 `Prettier` 扩展；
- 配置 `editor.defaultFormatter` 为 `esbenp.prettier-vscode`；
- 用命令行 `pnpm exec prettier <file>` 验证规则本身是否生效。

### 2. `Prettier` 的格式化结果不符合个人阅读习惯

#### 现象

某些表达式被压成一行，可读性较差，希望它自动拆行。

#### 原因

- `Prettier` 的目标是统一排版，不是让使用者精细控制每一处换行；
- 是否拆行主要受 `printWidth` 影响；
- 如果一段代码没有超过 `printWidth`，`Prettier` 往往会把它收成一行。

#### 解决方案

- 通过 `printWidth` 调整整体换行阈值，比如从 `100` 调到 `80`；
- 对特别长的表达式，优先改写代码结构，而不是和 `Prettier` 的换行策略硬碰硬；
- 极少数必须保留自定义排版的场景，可以使用 `// prettier-ignore`。

#### 结论

`Prettier` 适合控制“整体风格”，不适合承担“每一处都按个人审美排版”的职责。

### 3. `if` 分支想强制带花括号，为什么 `Prettier` 解决不了

#### 现象

Agent 生成的代码有时会写成：

```js
if (ok) doSomething();
```

希望无论分支代码多短，都强制写成带花括号的形式。

#### 原因

这不是格式问题，而是代码规范问题：

- `Prettier` 负责排版；
- `ESLint` 负责规则约束。

#### 解决方案

在 `eslint.config.mjs` 中启用：

```js
curly: ["error", "all"];
```

这样可以强制所有分支语句显式带花括号。

### 4. 已经配置了 `curly`，为什么编辑器里不报错

#### 现象

命令行 `eslint` 能检测到 `if (ok) doSomething();`，但编辑器里没有红线或 Problems 提示。

#### 原因

仓库配置已经生效，问题出在编辑器侧：

- `ESLint` 扩展未正确接管当前文件；
- flat config 未被扩展正确识别；
- `javascript` 语言未纳入 `eslint.validate`；
- 只有 `Prettier` 在工作，`ESLint` 扩展没有完全接上。

#### 解决方案

工作区建议配置：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  },
  "eslint.useFlatConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

并确认：

- 已安装并启用 `ESLint` 扩展；
- 重载编辑器窗口；
- 通过 `ESLint: Show Output Channel` 查看扩展运行日志。

### 5. `.prettierignore` 怎么写更合理

#### 现象

当前忽略规则里包含：

- `.specify/*`
- `.github/*`
- `*.md`
- `*.yaml`

#### 问题

这份忽略规则偏宽，会把很多本来值得格式化的手写文件也排除掉，例如：

- `posts/*.md`
- `docs/*.md`
- `README.md`
- `.github/workflows/*.yml`

#### 解决方案

优先忽略这两类内容：

- 生成物、缓存和构建产物：如 `.next`、`out`
- 明确不想维护格式的机器产物：如 `pnpm-lock.yaml`、`.specify`

不要轻易按文件类型一刀切忽略 `*.md`、`*.yaml`。

#### 经验

判断标准可以简化成一句话：

- 手写、长期维护、需要 review 的文件，尽量不要 ignore；
- 生成物、锁文件、临时产物，优先 ignore。

### 6. 提交前检查和 CI 应该怎么分工

#### 核心结论

- 本地 `pre-commit`：适合自动修复，减少打断；
- CI：只做检查，不做修复，作为最终裁判。

#### 推荐方案

本地提交前：

- `eslint --fix`
- `prettier --write`

CI 中：

- `eslint .`
- `prettier --check .`

#### 原因

如果 CI 里也做 `--fix`，会出现“流水线修改了代码但本地工作区没有对应修改”的不一致，增加协作成本。

### 7. `husky` 应该怎么用

#### 推荐职责

- `husky`：触发 Git hooks；
- `lint-staged`：只处理当前暂存文件；
- `pre-commit`：执行自动修复。

#### 推荐组合

- `eslint --fix`
- `prettier --write`

这样能把低成本问题收敛在提交前，而不是等到 CI 再失败。

### 7.1 `post-commit` 里触发 Raycast Confetti，为什么最后选最小写法

#### 场景

希望在本地提交成功后触发 Raycast 的 Confetti，但又不想因为个人环境差异影响 `git commit`。

#### 一开始为什么会失败

如果在 `.husky/post-commit` 里直接写：

```sh
raycast://extensions/raycast/raycast/confetti
```

shell 会把它当成“要执行的命令路径”，而不是 URL Scheme，所以会报：

- `No such file or directory`

#### 为什么改成 `open`

在 macOS 里，正确做法是让系统去打开这个 URL Scheme：

```sh
open "raycast://extensions/raycast/raycast/confetti"
```

这里的 `open` 才是 shell 里真正能执行的命令，`raycast://...` 只是它要打开的目标。

#### 为什么不继续做更重的 Raycast 安装检测

一种思路是先检查 Raycast 是否安装，比如用 `mdfind` 搜索 bundle id。

但这个场景里，我们真正关心的不是“事前精确判断 Raycast 是否存在”，而是：

- 能放彩带就放；
- 放不了就安静跳过；
- 不要阻塞提交流程。

所以更合适的策略是采用最小可用解：

```sh
#!/bin/sh

command -v open >/dev/null 2>&1 || exit 0
open "raycast://extensions/raycast/raycast/confetti" >/dev/null 2>&1 || true
```

#### 这段脚本分别在做什么

- `command -v open >/dev/null 2>&1 || exit 0`
  - 先检查当前环境是否存在 `open`
  - 没有就直接退出，不报错
- `open "raycast://..." >/dev/null 2>&1 || true`
  - 尝试打开 Raycast Confetti
  - 即使 Raycast 没装、scheme 没注册、打开失败，也不让 hook 失败

#### 为什么这版更适合个人项目

它的优点是：

- 足够短，维护成本低；
- 不依赖 `mdfind` 这类额外检查；
- 失败路径统一被兜底，不影响提交；
- 对“提交成功后顺手放个彩带”这种辅助能力来说已经够用。

#### 它的边界

这段脚本本质上是 **macOS 优先** 的：

- `open` 是 macOS 的常用打开方式；
- Raycast 本身也是 macOS 应用。

因此这不是一个面向跨平台协作的功能，而是一个“本地增强、不影响主流程”的附加体验。

#### 最后结论

对这类“锦上添花”的 hook，优先遵守这条原则：

- 主流程必须稳定；
- 辅助能力能成功就成功；
- 失败时必须静默退出，不要干扰提交。

### 8. 怎么把 lint 检查接进 GitHub Actions

#### 推荐方式

把 `lint` 单独做成一个 job，然后让 `build-and-deploy` 依赖它：

- `lint` 负责跑 `eslint` 和 `prettier --check`
- `build-and-deploy` 通过 `needs: lint` 依赖 lint 成功

#### 收益

- lint 失败时，后续构建和部署不会继续浪费时间；
- 流程职责更清晰；
- 更接近真实团队里的 CI 分层方式。

### 9. `unplugin-auto-import` 要不要引入

#### 结论

这个项目暂时不需要把它作为优先事项。

#### 原因

- 当前项目是 `Next.js 16 + App Router`；
- 现在更值得先夯实 `Prettier / ESLint / Husky / CI` 这条基础链路；
- `unplugin-auto-import` 属于“提效增强”，不是工程化基础设施；
- 在 Next.js 当前生态下，如果为了 auto import 增加额外 bundler 定制，收益和维护成本需要仔细权衡。

#### 更稳的替代方案

- 继续使用 IDE 自动导入；
- 保存时整理未使用 import；
- 优先保持显式 import 的可读性和可 review 性。

### 10. Turbopack 能不能原生解决自动导入

#### 结论

不能。Turbopack 的职责是打包和编译性能，不是自动改写源码来补 import。

#### 容易混淆的点

React 的 automatic JSX runtime 只解决了“不需要手写 `import React from "react"`”，但并不会自动导入：

- `useEffect`
- `useState`
- `notFound`
- 项目内工具函数

所以自动导入这件事，更多还是依赖：

- IDE；
- 第三方插件；
- 或者显式 import。

## 本次涉及的关键知识点

### `Prettier` 和 `ESLint` 的职责边界

- `Prettier`：排版统一
- `ESLint`：规范约束和质量检查

典型例子：

- 是否换行、缩进、空格：交给 `Prettier`
- `if` 是否必须带花括号：交给 `ESLint`

### 编辑器扩展和仓库规则不是一回事

- 扩展负责本地体验；
- 仓库配置决定规则；
- CI 负责最终兜底。

所以“本地没报错”不等于“规则没生效”，需要区分是扩展问题还是仓库配置问题。

### 本地自动修复和 CI 检查应该分层

- 本地：尽量自动修，让人少做机械劳动；
- CI：只做检查，让结果保持可预测。

### Ignore 规则要按“文件职责”写，而不是只按扩展名写

忽略策略的本质不是“哪些类型我不喜欢”，而是“哪些文件不值得纳入统一格式管理”。

## 推荐的最小工程化闭环

### 本地编辑阶段

- `Prettier` 扩展负责 `formatOnSave`
- `ESLint` 扩展负责 Problems 和保存时自动修复

### 提交阶段

- `husky + lint-staged`
- 对暂存文件执行 `eslint --fix` 和 `prettier --write`

### CI 阶段

- `pnpm exec eslint .`
- `pnpm exec prettier --check .`

### 规则层

- 用 `Prettier` 统一风格；
- 用 `ESLint` 约束规范；
- 用 CI 确保任何人、任何工具产出的代码最终都被同一套规则收口。

## 建议的学习顺序

### 第一阶段：先跑通闭环

优先目标：

- 本地保存自动格式化
- 本地保存自动修复 lint
- 提交前自动检查
- CI 自动校验

这一阶段最重要的是建立“规则真正落地”的认知。

### 第二阶段：补高价值 ESLint 规则

建议优先理解并按需开启：

- `curly`
- `eqeqeq`
- `prefer-const`
- `no-var`
- `no-console`

重点不是堆配置，而是理解每条规则到底在防什么问题。

### 第三阶段：再研究提效类增强

例如：

- import 排序
- 更细的 `Prettier` 风格调整
- `unplugin-auto-import`

这些都值得学，但优先级应低于基础工程化闭环。

## 当前推荐动作

如果继续沿着这次学习路径往下做，建议按这个顺序推进：

1. 收紧 `.prettierignore`，避免误伤手写文档和工作流文件；
2. 在 `package.json` 中补齐检查脚本，如 `lint`、`format:check`；
3. 接入 `husky + lint-staged`；
4. 在 GitHub Actions 中增加独立的 `lint` job；
5. 等基础链路稳定后，再评估是否真的需要 auto import。
