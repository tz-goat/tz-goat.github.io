"use client";

import { useEffect } from "react";
import { trackPlausibleEvent } from "@/lib/analytics";

interface PostViewTrackerProps {
  slug: string;
  title: string;
}

/**
 * 文章详情页需要单独记录“被真正打开”的事件。
 * 这样我们后续看统计时，可以把列表点击和详情浏览区分开，判断内容吸引力与实际阅读量。
 */
export default function PostViewTracker({ slug, title }: PostViewTrackerProps) {
  useEffect(() => {
    trackPlausibleEvent("post_detail_view", {
      props: {
        slug,
        title,
      },
    });
  }, [slug, title]);

  return null;
}
