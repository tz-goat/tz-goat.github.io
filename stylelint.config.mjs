import customNoRawColor from "./plugins/no-raw-color.mjs";
/**
 * Stylelint 基础配置。
 * 职责：守住 globals.css 的主题入口与书写边界，并对 Tailwind v4 语法放行。
 * 原因：stylelint-config-standard 不了解 Tailwind v4 的扩展 at-rule，
 *       也不了解当前项目有意保留的 BEM 全局类命名和主题 token 定义区。
 * 边界：本配置只处理 Stylelint 内置规则与全局基础约定；
 *       项目级自定义规则（如 token 区外禁止原始颜色值）会单独落在本地 rules 目录下。
 */
/** @type {import("stylelint").Config} */
const stylelintConfig = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [".next/**", "out/**", "build/**", "dist/**", "node_modules/**"],
  plugins: [customNoRawColor],
  rules: {
    // 放行 Tailwind v4 扩展 at-rule；保留规则本身，避免出现未知 at-rule 静默通过。
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["theme", "plugin", "custom-variant"],
      },
    ],
    // Tailwind v4 官方推荐使用字符串导入包；强行要求 url() 不符合生态习惯。
    "import-notation": null,
    // 纯排版偏好，优先级低于架构边界；后续要严格排版时再开启。
    "at-rule-empty-line-before": null,
    // 统一 hex 长度属于低风险格式收益，保留即可自动修复。
    "color-hex-length": "short",
    // 现代语法统一策略：先 warning 跑通存量代码，避免首次接入就被刷红。
    "color-function-alias-notation": ["without-alpha", { severity: "warning" }],
    "color-function-notation": ["modern", { severity: "warning" }],
    "alpha-value-notation": ["percentage", { severity: "warning" }],
    "media-feature-range-notation": ["context", { severity: "warning" }],
    // 全局类名保留 BEM 风格；允许 block__element 与 block__element--modifier。
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
      {
        severity: "warning",
        message:
          "全局类名请使用 kebab-case 或 BEM（block__element / block__element--modifier），避免无结构命名。",
      },
    ],
    "custom/no-raw-color-outside-theme": true,
  },
};
export default stylelintConfig;
