"use client";

import Link, { type LinkProps } from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import {
  trackPlausibleEvent,
  type PlausibleEventOptions,
} from "@/lib/analytics";

interface AnalyticsLinkProps
  extends LinkProps, Omit<ComponentPropsWithoutRef<"a">, "href"> {
  eventName?: string;
  eventOptions?: PlausibleEventOptions;
}

/**
 * 在不侵入页面结构的前提下，为关键链接补充点击埋点。
 * 组件仍然保持 Link 的导航语义，只在点击未被外部阻止时顺手上报事件。
 */
export default function AnalyticsLink({
  eventName,
  eventOptions,
  onClick,
  ...props
}: AnalyticsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || !eventName) {
      return;
    }

    trackPlausibleEvent(eventName, eventOptions);
  };

  return <Link {...props} onClick={handleClick} />;
}
