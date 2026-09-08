"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type ThemeMode, useTheme } from "@/app/theme-provider";

/** 主题菜单选项只描述策略值、文案和图标，不承载任何额外状态。 */
interface ThemeOption {
  value: ThemeMode;
  label: string;
  icon: LucideIcon;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

const THEME_TRIGGER_CLASS_NAME =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200/80 bg-white/85 text-zinc-700 shadow-sm backdrop-blur-md transition-all duration-150 ease-out hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800/80 dark:bg-zinc-950/85 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:text-white sm:h-10 sm:w-10";
const THEME_MENU_CLASS_NAME =
  "absolute right-0 top-full mt-2 inline-flex origin-top-right gap-1 rounded-full border border-zinc-200/80 bg-gradient-to-b from-white/90 to-white/75 p-1 shadow-lg backdrop-blur-md transition-all duration-150 ease-out transform-gpu will-change-transform dark:border-zinc-800/80 dark:from-zinc-950/90 dark:to-zinc-950/75";
const THEME_MENU_OPEN_CLASS_NAME =
  "visible translate-y-0 scale-100 opacity-100 pointer-events-auto";
const THEME_MENU_CLOSED_CLASS_NAME =
  "invisible -translate-y-1 scale-95 opacity-0 pointer-events-none";
const THEME_OPTION_BASE_CLASS_NAME =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-150 ease-out sm:h-9 sm:w-9";
const THEME_OPTION_ACTIVE_CLASS_NAME =
  "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950";
const THEME_OPTION_INACTIVE_CLASS_NAME =
  "border-transparent text-zinc-600 hover:border-zinc-300 hover:bg-white/80 hover:text-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:text-white";

/**
 * ThemeToggle 只负责把全局主题状态映射成一个轻量的图标入口。
 * 主题本身仍由 ThemeProvider 托管，这里只维护菜单开合，避免出现第二份主题状态源。
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentOption = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[2];
  const CurrentIcon = currentOption.icon;

  /**
   * 菜单打开后要支持点击外部和按 Escape 关闭，避免固定在右上角时遮挡页面交互。
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleThemeSelect = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={THEME_TRIGGER_CLASS_NAME}
        aria-label={`主题切换，当前为${currentOption.label}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`主题：${currentOption.label}`}
      >
        <CurrentIcon className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <div
        className={[
          THEME_MENU_CLASS_NAME,
          isOpen ? THEME_MENU_OPEN_CLASS_NAME : THEME_MENU_CLOSED_CLASS_NAME,
        ].join(" ")}
        aria-label="选择主题模式"
      >
        {THEME_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleThemeSelect(option.value)}
              className={[
                THEME_OPTION_BASE_CLASS_NAME,
                isActive ? THEME_OPTION_ACTIVE_CLASS_NAME : THEME_OPTION_INACTIVE_CLASS_NAME,
              ].join(" ")}
              aria-label={option.label}
              aria-pressed={isActive}
              title={option.label}
            >
              <OptionIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
