import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "博客",
  description: "所有文章列表",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 返回首页
        </Link>

        <h1 className="mb-12 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          博客
        </h1>

        {posts.length === 0 ? (
          <p className="text-zinc-500">还没有文章。</p>
        ) : (
          <ul className="space-y-10">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <time className="text-sm text-zinc-400">{post.date}</time>
                  <h2 className="mt-1 text-xl font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                    {post.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
