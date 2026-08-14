"use client";

import { useEffect, useRef } from "react";

interface PostContentProps {
  html: string;
}

export default function PostContent({ html }: PostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const renderMermaidDiagrams = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const mermaidBlocks = Array.from(
        container.querySelectorAll<HTMLElement>('[data-mermaid="true"]'),
      );
      if (mermaidBlocks.length === 0) {
        return;
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const mermaid = (await import("mermaid")).default;

      if (cancelled) {
        return;
      }

      mermaid.initialize({
        startOnLoad: false,
        theme: prefersDark ? "dark" : "default",
      });

      for (const [index, block] of mermaidBlocks.entries()) {
        const source = block.dataset.mermaidSource ?? block.textContent ?? "";
        const trimmedSource = source.trim();

        if (!trimmedSource) {
          continue;
        }

        block.dataset.mermaidSource = source;

        try {
          const diagramId = `mermaid-${index}-${Math.random().toString(36).slice(2, 8)}`;
          const { svg, bindFunctions } = await mermaid.render(diagramId, trimmedSource);

          if (cancelled) {
            return;
          }

          block.innerHTML = svg;
          bindFunctions?.(block);
        } catch (error) {
          console.error("Failed to render mermaid diagram", error);
          block.textContent = source;
          block.dataset.mermaidError = "true";
        }
      }
    };

    void renderMermaidDiagrams();

    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="prose prose-zinc dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
