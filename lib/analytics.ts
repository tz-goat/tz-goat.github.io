"use client";

type PlausiblePrimitive = string | number | boolean;

/** 自定义事件透传给 Plausible 的最小配置。 */
export interface PlausibleEventOptions {
  props?: Record<string, PlausiblePrimitive>;
  callback?: () => void;
}

type PlausibleFn = (eventName: string, options?: PlausibleEventOptions) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & {
      q?: IArguments[];
    };
  }
}

/**
 * 统一封装客户端埋点调用，避免业务组件到处直接依赖全局变量。
 * 这里故意在找不到 window 或 Plausible 时静默返回，让静态导出和本地开发都能平滑运行。
 */
export function trackPlausibleEvent(
  eventName: string,
  options?: PlausibleEventOptions,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.plausible?.(eventName, options);
}
