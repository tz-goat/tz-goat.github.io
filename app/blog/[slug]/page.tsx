import Link from "next/link";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    return { title: post.title, description: post.description };
  } catch {
    return {};
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/blog"
          className="mb-12 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 所有文章
        </Link>

        <article>
          <header className="mb-10">
            <time className="text-sm text-zinc-400">{post.date}</time>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {post.title}
            </h1>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
              {post.description}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/tags/${t}`}
                    className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </header>

          <div
            className="prose prose-zinc dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>
      </main>
    </div>
  );
}
