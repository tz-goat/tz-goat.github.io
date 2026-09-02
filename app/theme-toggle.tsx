"use client";

import { useMemo } from "react";
import { type ThemeMode, useTheme } from "@/app/theme-provider";

/** 主题切换选项的最小展示模型。 */
interface ThemeOption {
  value: ThemeMode;
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟随系统" },
];

/**
 * ThemeToggle 只负责消费全局主题状态并暴露切换入口。
 * 它不保存主题本身，所有状态都来自 ThemeProvider，这样按钮只是“控制器”而不是第二份状态源。
 */
export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  /**
   * 给当前策略补一层可读文案，方便把“策略值”和“最终结果”同时展示出来。
   * 这样在 `system` 模式下，用户也能明确看到页面现在实际落在哪个主题上。
   */
  const currentLabel = useMemo(() => {
    if (theme === "system") {
      return `跟随系统（当前${resolvedTheme === "dark" ? "深色" : "浅色"}）`;
    }

    return theme === "dark" ? "深色" : "浅色";
  }, [resolvedTheme, theme]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:text-white"
        aria-label={`快速切换到${resolvedTheme === "dark" ? "浅色" : "深色"}主题`}
      >
        {resolvedTheme === "dark" ? "切到浅色" : "切到深色"}
      </button>

      <label className="inline-flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">主题</span>
        <select
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemeMode)}
          className="rounded-full border border-zinc-200 bg-transparent px-3 py-1 text-sm text-zinc-700 outline-none transition hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-600"
          aria-label="选择主题模式"
        >
          {THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <span className="text-xs text-zinc-500 dark:text-zinc-400">{currentLabel}</span>
    </div>
  );
}
