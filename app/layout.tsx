import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/theme-provider";
import ThemeToggle from "@/app/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 网页标题：SEO权重最高，格式【站点标题 | 简短描述/你的名字】
  title: {
    default: "二魔的技术博客 | 前端全栈开发笔记",
    template: "%s | 二魔的技术博客", // 子页面自动套用模板，比如文章页：文章标题 | 二魔的技术博客
  },
  // meta‑description：搜索引擎摘要、AI AEO非常依赖，120‑160字符，写清楚你是谁、博客内容、价值，不要空话
  description: "前端全栈开发个人博客，分享Vue、React、TypeScript、Node工程化实战笔记，记录学习复盘、项目实践，技术总结与思考。",
  // 🔗 核心SEO/AEO 扩展（简历博客强烈建议补齐）
  authors: [{ name: "二魔", url: "https://tz-goat.github.io" }],
  creator: "二魔",
  keywords: [
    "前端博客",
    "Next.js",
    "Vue",
    "TypeScript",
    "全栈开发",
    "前端面试",
    "工程化",
    "Node.js",
  ],

  // Open Graph：社交分享、AI爬虫预览，面试面试官复制链接点开预览好看，简历加分
  openGraph: {
    title: "二魔的技术博客 | 前端全栈开发笔记",
    description:
      "前端全栈开发个人博客，分享Vue、React、TypeScript、Node工程化实战笔记，记录学习复盘、项目实践。",
    url: "https://tz-goat.github.io",
    siteName: "二魔的技术博客",
    locale: "zh_CN",
    type: "website",
    // images: [{ url: "/og‑image.png", width:1200, height:630, alt:"博客封面" }], // 建议做一张1200×630的og图放public
  },

  // twitter 卡片，国内可保留，很多AI抓取也会读取
  twitter: {
    card: "summary_large_image",
    title: "二魔的技术博客 | 前端全栈开发笔记",
    description:
      "前端全栈开发个人博客，分享Vue、React、TypeScript、Node工程化实战笔记，记录学习复盘、项目实践。",
    // images: ["/og‑image.png"],
  },

  // 禁止Next默认的robots，自己显式声明爬虫规则，AEO很看重robots语义
  robots: {
    index: true, // 允许搜索引擎收录当前页面；改 false 会导致搜不到该页面
    follow: true, // 允许爬虫继续抓取页面上的外链；改 false 会切断站内链接权重传递
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': "large", // 允许 Google 搜索结果显示大尺寸视频预览；none/small/large
      'max-image-preview': "large", // 允许 Google 搜索结果显示大尺寸图片预览；none/small/large
    },
  },

  // 规范 canonical，防止重复内容被降权，根域名填写你的正式域名
  alternates: {
    // 告诉搜索引擎“这才是当前页面的权威地址”，避免 www 带/不带、http/https、带不带查询参数等多入口被当成重复内容分散权重
    canonical: "https://tz-goat.github.io",
  },
};

const themeInitScript = `
(() => {
  const storageKey = "blog-theme";
  const mediaQuery = "(prefers-color-scheme: dark)";
  const root = document.documentElement;

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    const theme = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";
    const resolvedTheme = theme === "system"
      ? (window.matchMedia(mediaQuery).matches ? "dark" : "light")
      : theme;

    root.dataset.theme = resolvedTheme;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  } catch {
    const resolvedTheme = window.matchMedia(mediaQuery).matches ? "dark" : "light";
    root.dataset.theme = resolvedTheme;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }
})();
`;

/**
 * RootLayout 负责装配全站共享能力。
 * 主题 Provider 必须挂在这里，后续任何页面里的 ThemeToggle 或客户端增强逻辑才能读到同一份主题状态。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
