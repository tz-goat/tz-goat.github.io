"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** 用户选择的主题策略，`system` 表示跟随操作系统主题。 */
export type ThemeMode = "light" | "dark" | "system";

/** 页面最终真正渲染出来的主题结果，只会是亮色或深色。 */
export type ResolvedTheme = "light" | "dark";

/**
 * Theme Context 对外暴露的最小能力集。
 * 这里同时保留“用户选择”和“最终结果”，避免消费方重复解析 system。
 */
interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

/** ThemeProvider 的 children 透传给整棵应用树。 */
interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = "blog-theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 收口主题字符串校验，避免 localStorage 污染把非法值带进状态树。
 */
function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * 读取用户上次保存的主题策略。
 * 服务端或首轮不可访问浏览器对象时，回退为 `system`。
 */
function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

/**
 * 读取当前系统主题。
 * 这里只负责解析浏览器环境，不掺杂用户策略判断。
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

/**
 * 把主题结果同步到根节点。
 * CSS 变量、Tailwind `dark:` 变体和浏览器原生控件都依赖这一步统一收口。
 */
function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/**
 * ThemeProvider 负责维护站点唯一的主题真相来源：
 * - 保存用户选择的主题策略
 * - 监听系统主题变化
 * - 把最终主题同步给 DOM，供 CSS / Tailwind / 第三方渲染读取
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  /**
   * 只有在用户选择 `system` 时，系统主题变化才应该影响页面。
   * 这里单独维护一份 systemTheme，避免每个消费方各自监听 media query。
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const updateSystemTheme = (matches: boolean) => {
      setSystemTheme(matches ? "dark" : "light");
    };

    updateSystemTheme(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updateSystemTheme(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    return theme === "system" ? systemTheme : theme;
  }, [systemTheme, theme]);

  /**
   * 用户策略变化后持久化到 localStorage，保证刷新后仍能恢复选择。
   * 持久化的是策略值而不是 resolvedTheme，这样 `system` 才能继续跟随设备。
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // 存储失败时保持静默，避免主题功能被非关键异常打断。
    }
  }, [theme]);

  /**
   * DOM 始终只消费最终主题结果。
   * 这样 CSS、Tailwind 和客户端增强逻辑就不需要理解 `system` 这个中间态。
   */
  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  /**
   * 切换按钮的快捷能力：基于当前最终主题在亮暗之间翻转。
   * 即使当前策略是 `system`，也能从“当前显示结果”平滑切到相反主题。
   */
  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextResolvedTheme = (currentTheme === "system" ? systemTheme : currentTheme) === "dark"
        ? "light"
        : "dark";
      return nextResolvedTheme;
    });
  }, [systemTheme]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    };
  }, [resolvedTheme, theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme 是主题状态的唯一消费入口。
 * 强制要求在 ThemeProvider 内部使用，避免组件悄悄退化成“无主题上下文”的假正常状态。
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
