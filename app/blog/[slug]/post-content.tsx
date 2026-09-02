"use client";

import mediumZoom from "medium-zoom";
import { memo, useCallback, useEffect, useRef, useState } from "react";

/** Markdown 正文最终产出的 HTML 字符串。 */
interface PostContentProps {
  html: string;
}

/** Mermaid 预览弹层需要的最小数据集。 */
interface MermaidPreview {
  svg: string;
  title: string;
}

/** 正文内容区需要把“打开 Mermaid 预览”的动作上抛给父组件。 */
interface ArticleHtmlContentProps {
  html: string;
  onOpenMermaidPreview: (preview: MermaidPreview) => void;
}

/**
 * 只负责“正文 HTML + 客户端增强”这部分：
 * 1. 把 Mermaid 占位节点渲染成 SVG
 * 2. 给正文图片接入 medium-zoom
 * 3. 监听 Mermaid 图点击，把预览数据交给父组件
 *
 * 这里用 memo 包裹，是为了避免父组件只因为弹层开关重渲染时，
 * 把已经增强过的正文 DOM 又重新刷一遍。
 */
const ArticleHtmlContent = memo(function ArticleHtmlContent({
  html,
  onOpenMermaidPreview,
}: ArticleHtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageZoomRef = useRef<ReturnType<typeof mediumZoom> | null>(null);

  /**
   * 把服务端输出的 Mermaid 占位节点替换成真正的 SVG。
   * 这段逻辑只依赖 html，因为文章正文变化时才需要重新扫描并渲染。
   */
  useEffect(() => {
    let cancelled = false;

    const renderMermaidDiagrams = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

        /** 只处理服务端阶段预埋好的 Mermaid 占位节点。 */
      const mermaidBlocks = Array.from(
        container.querySelectorAll<HTMLElement>('[data-mermaid="true"]'),
      );
      if (mermaidBlocks.length === 0) {
        return;
      }

        /** Mermaid 主题跟随系统明暗模式，避免图表和正文主题割裂。 */
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const mermaid = (await import("mermaid")).default;

      if (cancelled) {
        return;
      }

        /** Mermaid 在当前文章容器内只初始化一次，然后复用到每个图表节点。 */
      mermaid.initialize({
        startOnLoad: false,
        theme: prefersDark ? "dark" : "default",
      });

      for (const [index, block] of mermaidBlocks.entries()) {
          /** 优先复用缓存过的源码，避免重复渲染后拿不到原始 Mermaid 文本。 */
        const source = block.dataset.mermaidSource ?? block.textContent ?? "";
        const trimmedSource = source.trim();

        if (!trimmedSource) {
          continue;
        }

          /** 首次渲染前把源码存回 dataset，后续打开预览或重渲染还能继续使用。 */
        block.dataset.mermaidSource = source;

        try {
          const diagramId = `mermaid-${index}-${Math.random().toString(36).slice(2, 8)}`;
          const { svg, bindFunctions } = await mermaid.render(diagramId, trimmedSource);

          if (cancelled) {
            return;
          }

            /** 用 Mermaid 生成的 SVG 回填占位节点，并补上可点击预览的可访问性语义。 */
          block.innerHTML = svg;
          block.removeAttribute("data-mermaid-error");
          block.setAttribute("role", "button");
          block.tabIndex = 0;
          block.setAttribute("aria-label", "点击放大 Mermaid 图表");
          bindFunctions?.(block);
        } catch (error) {
            /** 渲染失败时回退为源码文本，至少保证正文内容仍然可读。 */
          console.error("Failed to render mermaid diagram", error);
          block.textContent = source;
          block.dataset.mermaidError = "true";
          block.removeAttribute("role");
          block.removeAttribute("tabindex");
          block.removeAttribute("aria-label");
        }
      }
    };

    void renderMermaidDiagrams();

    return () => {
      cancelled = true;
    };
  }, [html]);

  /**
   * 为正文中的普通图片接入 medium-zoom。
   * 重新执行前先 detach 旧实例，避免同一批图片被重复绑定放大行为。
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
    imageZoomRef.current?.detach();
    imageZoomRef.current = null;

    if (images.length === 0) {
      return;
    }

    const zoom = mediumZoom(images, {
      margin: 32,
      background: "rgba(9, 9, 11, 0.88)",
    });
    imageZoomRef.current = zoom;

    return () => {
      zoom.detach();
      if (imageZoomRef.current === zoom) {
        imageZoomRef.current = null;
      }
    };
  }, [html]);

  /**
   * 事件代理处理 Mermaid 图的点击和键盘触发。
   * 这里不直接维护弹层状态，而是把预览数据交给父组件统一管理，
   * 这样正文 DOM 和弹层状态可以解耦。
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const openPreview = (block: HTMLElement) => {
      if (block.dataset.mermaidError === "true") {
        return;
      }

      const svg = block.innerHTML.trim();
      if (!svg.includes("<svg")) {
        return;
      }

      onOpenMermaidPreview({
        svg,
        title: block.getAttribute("aria-label") ?? "Mermaid 图表预览",
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const block = target.closest<HTMLElement>(".mermaid-diagram");
      if (!block || !container.contains(block)) {
        return;
      }

      openPreview(block);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const block = target.closest<HTMLElement>(".mermaid-diagram");
      if (!block || !container.contains(block)) {
        return;
      }

      event.preventDefault();
      openPreview(block);
    };

    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("click", handleClick);
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [html, onOpenMermaidPreview]);

  return (
    <div
      ref={containerRef}
      className="prose prose-zinc dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

/**
 * 外层容器只负责“预览态”：
 * - 保存当前打开的 Mermaid 预览数据
 * - 处理 Esc 关闭和 body 滚动锁
 * - 渲染 Lightbox
 */
export default function PostContent({ html }: PostContentProps) {
  const [mermaidPreview, setMermaidPreview] = useState<MermaidPreview | null>(null);

  /** 稳定传给子组件的回调，避免 memo 因函数引用变化失效。 */
  const handleOpenMermaidPreview = useCallback((preview: MermaidPreview) => {
    setMermaidPreview(preview);
  }, []);

  /** 只有弹层打开时才注册 Esc 监听，并顺手锁住页面滚动。 */
  useEffect(() => {
    if (!mermaidPreview) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMermaidPreview(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mermaidPreview]);

  return (
    <>
      <ArticleHtmlContent html={html} onOpenMermaidPreview={handleOpenMermaidPreview} />

      {mermaidPreview ? (
        <div
          className="diagram-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={mermaidPreview.title}
          onClick={() => setMermaidPreview(null)}
        >
          <div className="diagram-lightbox__panel" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="diagram-lightbox__close"
              onClick={() => setMermaidPreview(null)}
            >
              X
            </button>
            <div
              className="diagram-lightbox__content"
              dangerouslySetInnerHTML={{ __html: mermaidPreview.svg }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
