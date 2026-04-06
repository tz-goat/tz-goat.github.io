import Link from "next/link";
import { getAllTagSlugs, getPostsByTagSlug } from "@/lib/posts";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTagSlugs();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return {
    title: `标签：${tag}`,
    description: `包含「${tag}」标签的文章`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = getPostsByTagSlug(tag);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/blog"
          className="mb-12 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 所有文章
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          标签：{tag}
        </h1>
        <p className="mb-12 text-zinc-500 dark:text-zinc-400">
          共 {posts.length} 篇文章
        </p>

        {posts.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            暂无带此标签的文章（或该标签尚未在内容中使用）。
          </p>
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
